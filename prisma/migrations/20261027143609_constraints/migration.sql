-- Business rules enforced by the database itself, so a bug in the app cannot break them.

-- Scan scores are fractions between 0 and 1.
ALTER TABLE "bag_scans"
  ADD CONSTRAINT "bag_scans_fill_level_range" CHECK ("fillLevel" IS NULL OR ("fillLevel" >= 0 AND "fillLevel" <= 1)),
  ADD CONSTRAINT "bag_scans_contamination_range" CHECK ("contamination" IS NULL OR ("contamination" >= 0 AND "contamination" <= 1)),
  ADD CONSTRAINT "bag_scans_confidence_range" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1));

-- The weighed value is the ground truth: positive weight, a reason when rejected,
-- a material when accepted. (One weighing per shipment is the unique index on shipmentId.)
ALTER TABLE "weighing_records"
  ADD CONSTRAINT "weighing_records_weight_positive" CHECK ("actualWeightKg" > 0),
  ADD CONSTRAINT "weighing_records_reject_reason" CHECK ("accepted" OR "rejectReason" IS NOT NULL),
  ADD CONSTRAINT "weighing_records_material_when_accepted" CHECK (NOT "accepted" OR "materialTypeId" IS NOT NULL);

-- Stock and capacity can never be negative.
ALTER TABLE "batches" ADD CONSTRAINT "batches_weight_non_negative" CHECK ("weightKg" >= 0);
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_capacity_positive" CHECK ("capacityKg" > 0);
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_capacity_positive" CHECK ("capacityKg" > 0);

-- Money and point rules.
ALTER TABLE "material_types"
  ADD CONSTRAINT "material_types_point_factor_non_negative" CHECK ("pointFactor" >= 0),
  ADD CONSTRAINT "material_types_price_non_negative" CHECK ("pricePerKg" >= 0);
ALTER TABLE "levels"
  ADD CONSTRAINT "levels_min_points_non_negative" CHECK ("minPoints" >= 0),
  ADD CONSTRAINT "levels_multiplier_at_least_one" CHECK ("multiplier" >= 1);
ALTER TABLE "citizen_profiles" ADD CONSTRAINT "citizen_profiles_points_non_negative" CHECK ("totalPoints" >= 0);
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantityKg" > 0),
  ADD CONSTRAINT "order_items_price_non_negative" CHECK ("unitPrice" >= 0);
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_total_non_negative" CHECK ("total" >= 0);

-- Points ledger is append-only: rows are never edited or deleted.
-- A mistake is fixed with a new row of opposite points.
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_points_not_zero" CHECK ("points" <> 0);

CREATE OR REPLACE FUNCTION points_ledger_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'points_ledger is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER points_ledger_no_update_delete
  BEFORE UPDATE OR DELETE ON "points_ledger"
  FOR EACH ROW EXECUTE FUNCTION points_ledger_append_only();
