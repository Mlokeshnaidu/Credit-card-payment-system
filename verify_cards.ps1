$accessToken = ""

Write-Host "Listing cards (should be empty)"
Invoke-RestMethod -Method GET http://localhost:8001/api/cards

$cardPayload = @{
    card_number = "4242424242424242"
    expiry_month = 12
    expiry_year = 2025
    cvv = "123"
    card_type = "CREDIT"
}
Write-Host "Creating a new card"
$cardResp = Invoke-RestMethod -Method POST http://localhost:8001/api/cards -ContentType "application/json" -Body ($cardPayload | ConvertTo-Json)
$cardId = $cardResp.id
Write-Host "Card created with ID: $cardId"

Write-Host "Listing cards after creation"
Invoke-RestMethod -Method GET http://localhost:8001/api/cards

Write-Host "Deleting the card"
Invoke-RestMethod -Method DELETE http://localhost:8001/api/cards/$cardId

Write-Host "Listing cards after deletion (should be empty)"
Invoke-RestMethod -Method GET http://localhost:8001/api/cards
