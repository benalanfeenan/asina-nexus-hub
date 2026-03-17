

# Insert NDIS Price List Items from CSV

## What
Bulk-insert 23 unique NDIS line items from the uploaded ShiftCare price export into the `ndis_price_list` table. Rows for "No Charge", "Sil Gerard Brazier", "Sil Hannah Chaffey", and "Rye Mumbi Sil" are excluded per your request (no NESS items were found in the file).

## Data to insert

Deduplicated by reference number (item_code). Descriptions include day/time context for clarity.

| # | Item Code | Description | Rate | Unit | Category |
|---|-----------|-------------|------|------|----------|
| 1 | 01_011_0107_1_1 | Assistance With Self Care - Standard 6am-8pm | 70.23 | hour | Core |
| 2 | 01_015_0107_1_1 | Assistance With Self Care - Evening 8pm-12am | 77.38 | hour | Core |
| 3 | 01_002_0107_1_1 | Assistance With Self Care - Night 12am-6am | 78.81 | hour | Core |
| 4 | 01_013_0107_1_1 | Assistance With Self Care - Saturday | 98.83 | hour | Core |
| 5 | 01_014_0107_1_1 | Assistance With Self Care - Sunday | 127.43 | hour | Core |
| 6 | 01_012_0107_1_1 | Assistance With Self Care - Public Holiday | 156.03 | hour | Core |
| 7 | 01_020_0120_1_1 | House Cleaning And Other Household Activities | 58.03 | hour | Core |
| 8 | 01_832_0115_1_1 | SIL Sleepover | 297.60 | each | Core |
| 9 | 04_104_0125_6_1 | Community Social & Rec Activities - Standard 6am-8pm | 70.23 | hour | Core |
| 10 | 04_103_0125_6_1 | Community Social & Rec Activities - Evening 8pm-12am | 77.38 | hour | Core |
| 11 | 04_105_0125_6_1 | Community Social & Rec Activities - Saturday | 98.83 | hour | Core |
| 12 | 04_106_0125_6_1 | Community Social & Rec Activities - Sunday | 127.43 | hour | Core |
| 13 | 04_102_0125_6_1 | Community Social & Rec Activities - Public Holiday | 156.03 | hour | Core |
| 14 | 04_102_0136_6_1 | Group Activities - Standard 6am-8pm | 70.23 | hour | Core |
| 15 | 04_103_0136_6_1 | Group Activities - Evening 8pm-12am | 77.38 | hour | Core |
| 16 | 04_104_0136_6_1 | Group Activities - Saturday | 98.83 | hour | Core |
| 17 | 04_105_0136_6_1 | Group Activities - Sunday | 127.43 | hour | Core |
| 18 | 04_106_0136_6_1 | Group Activities - Public Holiday | 156.03 | hour | Core |
| 19 | 04_599_0136_6_1 | Centre Capital Cost - Group & Centre Based | 2.59 | each | Core |
| 20 | 09_006_0106_6_3 | Life Transition Planning Incl. Mentoring & Peer Support | 80.06 | hour | Capacity Building |
| 21 | 09_009_0117_6_3 | Skills Development And Training | 80.06 | hour | Capacity Building |
| 22 | 10_016_0102_5_3 | Employment Assistance | 80.06 | hour | Capacity Building |
| 23 | 15_035_0106_1_3 | Assistance With Decision Making & Budgeting | 70.23 | hour | Capacity Building |

## How
- Single SQL INSERT via the Supabase insert tool (data operation, not a migration)
- All items set to `is_active = true`
- Categories assigned: items starting with 01/04 → "Core", items 09/10/15 → "Capacity Building"
- The table is currently empty so no conflict handling needed

