ALTER TABLE IF EXISTS receivables (
    UNIQUE (invoice_number, client_id)
);
