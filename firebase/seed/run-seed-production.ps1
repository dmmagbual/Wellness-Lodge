Set-Location "C:\AKALIKO\DMM\PERSONAL\CLAUDE\Projects\Wellness Lodge\firebase\seed"
$env:SEED_PRODUCTION = "yes"
$env:PROJECT_ID = "wellness-lodge"
# --force is required because this project was already seeded before; it
# overwrites the same sample documents with the updated demo content
# (photos, bank details) below. It does not touch bookings/receipts/audit
# logs -- only the seeded catalogue/settings/staff collections.
node seed.js --confirm=wellness-lodge --force
