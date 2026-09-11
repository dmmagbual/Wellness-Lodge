Set-Location "C:\AKALIKO\DMM\PERSONAL\CLAUDE\Projects\Wellness Lodge\firebase\seed"
$env:SEED_PRODUCTION = "yes"
$env:PROJECT_ID = "wellness-lodge"
node seed.js --confirm=wellness-lodge
