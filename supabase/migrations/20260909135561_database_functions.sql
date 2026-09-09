-- ============================================================
-- PeoplePay360 — Migration 5: Database Functions
-- Business-logic helper functions used by the backend.
-- ============================================================

-- ============================================
-- FUNCTION: get_applicable_contract
-- Returns the active contract for an employee
-- that covers a given payroll date.
--
-- A contract is applicable when:
--   start_date <= payroll_date
--   AND (end_date IS NULL OR end_date >= payroll_date)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_applicable_contract(
  p_employee_id UUID,
  p_payroll_date DATE
)
RETURNS SETOF contracts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.contracts
  WHERE employee_id = p_employee_id
    AND status = 'ACTIVE'
    AND start_date <= p_payroll_date
    AND (end_date IS NULL OR end_date >= p_payroll_date)
  ORDER BY start_date DESC
  LIMIT 1;
$$;

-- ============================================
-- FUNCTION: approve_time_off_request
-- Transactionally approves a time-off request:
--   1. Validates the request exists and is PENDING
--   2. Validates the allocation has sufficient balance
--   3. Updates the allocation's used_amount
--   4. Marks the request as APPROVED
--
-- Raises an exception if validation fails.
-- The CHECK constraint on time_off_allocations
-- (used_amount <= allocated_amount) provides a
-- final safety net at the database level.
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_time_off_request(
  p_request_id  UUID,
  p_approver_id UUID
)
RETURNS time_off_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request       time_off_requests;
  v_allocation    time_off_allocations;
  v_available     NUMERIC;
BEGIN
  -- 1. Lock and fetch the request
  SELECT * INTO v_request
  FROM public.time_off_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Time-off request % not found', p_request_id;
  END IF;

  IF v_request.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Request % is not in PENDING status (current: %)',
      p_request_id, v_request.status;
  END IF;

  -- 2. If the request has an allocation, validate balance
  IF v_request.allocation_id IS NOT NULL THEN
    SELECT * INTO v_allocation
    FROM public.time_off_allocations
    WHERE id = v_request.allocation_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Allocation % not found', v_request.allocation_id;
    END IF;

    v_available := v_allocation.allocated_amount - v_allocation.used_amount;

    IF v_request.duration > v_available THEN
      RAISE EXCEPTION 'Insufficient allocation balance. Requested: %, Available: %',
        v_request.duration, v_available;
    END IF;

    -- 3. Update the allocation's used_amount
    UPDATE public.time_off_allocations
    SET used_amount = used_amount + v_request.duration,
        updated_at  = NOW()
    WHERE id = v_request.allocation_id;
  END IF;

  -- 4. Approve the request
  UPDATE public.time_off_requests
  SET status      = 'APPROVED',
      approved_by = p_approver_id,
      approved_at = NOW(),
      updated_at  = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

-- ============================================
-- FUNCTION: refuse_time_off_request
-- Marks a PENDING request as REFUSED with a reason.
-- ============================================
CREATE OR REPLACE FUNCTION public.refuse_time_off_request(
  p_request_id      UUID,
  p_approver_id     UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS time_off_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request time_off_requests;
BEGIN
  SELECT * INTO v_request
  FROM public.time_off_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Time-off request % not found', p_request_id;
  END IF;

  IF v_request.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Request % is not in PENDING status (current: %)',
      p_request_id, v_request.status;
  END IF;

  UPDATE public.time_off_requests
  SET status           = 'REFUSED',
      approved_by      = p_approver_id,
      approved_at      = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at       = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

-- ============================================
-- FUNCTION: cancel_time_off_request
-- Cancels an APPROVED request and reverses the
-- allocation's used_amount.
-- ============================================
CREATE OR REPLACE FUNCTION public.cancel_time_off_request(
  p_request_id UUID
)
RETURNS time_off_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request time_off_requests;
BEGIN
  SELECT * INTO v_request
  FROM public.time_off_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Time-off request % not found', p_request_id;
  END IF;

  IF v_request.status NOT IN ('PENDING', 'APPROVED') THEN
    RAISE EXCEPTION 'Request % cannot be cancelled (current: %)',
      p_request_id, v_request.status;
  END IF;

  -- If it was approved and had an allocation, reverse the used_amount
  IF v_request.status = 'APPROVED' AND v_request.allocation_id IS NOT NULL THEN
    UPDATE public.time_off_allocations
    SET used_amount = GREATEST(used_amount - v_request.duration, 0),
        updated_at  = NOW()
    WHERE id = v_request.allocation_id;
  END IF;

  UPDATE public.time_off_requests
  SET status     = 'CANCELLED',
      updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

-- ============================================
-- FUNCTION: create_audit_log
-- Convenience function for the backend to insert
-- audit records. SECURITY DEFINER so it can bypass
-- RLS on the audit_logs table.
-- ============================================
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id     UUID,
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID DEFAULT NULL,
  p_old_values  JSONB DEFAULT NULL,
  p_new_values  JSONB DEFAULT NULL
)
RETURNS audit_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_old_values, p_new_values)
  RETURNING *;
$$;
