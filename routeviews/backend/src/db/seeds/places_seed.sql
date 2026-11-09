-- =============================================================
-- ConnectRwanda AI — sample places (real Kigali locations)
-- Source: 'seed' — distinguishable from OSM imports and community submissions.
-- Coordinates approximate; verify before relying on them for navigation.
-- No accessibility data seeded — all places start with 'unknown'.
-- Safe to re-run: only deletes seed rows that no business owner has claimed.
-- =============================================================

DELETE FROM places WHERE source = 'seed' AND owner_user_id IS NULL;

INSERT INTO places
  (name, name_rw, category, description, address, lat, lng, source, source_ref, status)
VALUES
-- ---------- Restaurants ----------
('Repub Lounge', NULL, 'restaurant', 'Popular restaurant and lounge with Rwandan and international cuisine.', 'KN 14 Ave, Kiyovu, Nyarugenge', -1.9445, 30.0587, 'seed', 'seed:repub-lounge', 'approved'),
('Heaven Restaurant', NULL, 'restaurant', 'Fine dining with a view over Kigali.', 'KN 29 St, Kiyovu, Nyarugenge', -1.9458, 30.0571, 'seed', 'seed:heaven', 'approved'),
('Pili Pili', NULL, 'restaurant', 'Riverside restaurant with grilled dishes.', 'KG 622 St, Nyarutarama, Gasabo', -1.9333, 30.1000, 'seed', 'seed:pili-pili', 'approved'),
('Sole Luna', NULL, 'restaurant', 'Italian restaurant in Kacyiru.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9350, 30.0833, 'seed', 'seed:sole-luna', 'approved'),
('Khana Khazana', NULL, 'restaurant', 'Indian restaurant in Kiyovu.', 'KN 4 Ave, Kiyovu, Nyarugenge', -1.9442, 30.0598, 'seed', 'seed:khana-khazana', 'approved'),
('Fasika', NULL, 'restaurant', 'Ethiopian restaurant in Remera.', 'KG 11 Ave, Remera, Gasabo', -1.9520, 30.1010, 'seed', 'seed:fasika', 'approved'),
('Chez Lando', NULL, 'restaurant', 'Long-standing restaurant and hotel near the airport.', 'KG 17 Ave, Remera, Gasabo', -1.9560, 30.1060, 'seed', 'seed:chez-lando', 'approved'),
('Meze Fresh', NULL, 'restaurant', 'Modern Rwandan and international cuisine.', 'KN 3 Rd, Kiyovu, Nyarugenge', -1.9450, 30.0620, 'seed', 'seed:meze-fresh', 'approved'),

-- ---------- Cafes ----------
('Bourbon Coffee', NULL, 'cafe', 'Coffee house chain serving Rwandan coffee.', 'KN 4 Ave, Kiyovu, Nyarugenge', -1.9444, 30.0601, 'seed', 'seed:bourbon-coffee', 'approved'),
('Question Coffee', NULL, 'cafe', 'Specialty coffee garden and roastery.', 'KG 5 Ave, Gishushu, Gasabo', -1.9450, 30.0900, 'seed', 'seed:question-coffee', 'approved'),
('Shokola', NULL, 'cafe', 'Storytelling cafe and restaurant.', 'KN 2 Ave, Kiyovu, Nyarugenge', -1.9455, 30.0605, 'seed', 'seed:shokola', 'approved'),
('Inzora Rooftop Cafe', NULL, 'cafe', 'Rooftop cafe with city views.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9345, 30.0820, 'seed', 'seed:inzora', 'approved'),

-- ---------- Fast food ----------
('KFC Kigali Heights', NULL, 'fast_food', 'Fried chicken chain.', 'KG 7 Ave, Kigali Heights, Gasabo', -1.9497, 30.0857, 'seed', 'seed:kfc-heights', 'approved'),
('Pizza Inn', NULL, 'fast_food', 'Pizza restaurant chain.', 'KN 3 Rd, Nyarugenge', -1.9447, 30.0609, 'seed', 'seed:pizza-inn', 'approved'),

-- ---------- Bars ----------
('Sundowner', NULL, 'bar', 'Bar and grill in Kiyovu.', 'KN 14 Ave, Kiyovu, Nyarugenge', -1.9448, 30.0590, 'seed', 'seed:sundowner', 'approved'),
('Zinc Nightclub', NULL, 'bar', 'Nightclub and bar in Kiyovu.', 'KN 4 Ave, Kiyovu, Nyarugenge', -1.9446, 30.0589, 'seed', 'seed:zinc', 'approved'),

-- ---------- Supermarkets ----------
('SPAR Kigali Heights', NULL, 'supermarket', 'Supermarket in Kigali Heights mall.', 'KG 7 Ave, Kigali Heights, Gasabo', -1.9497, 30.0857, 'seed', 'seed:spar-heights', 'approved'),
('SPAR City Tower', NULL, 'supermarket', 'Supermarket in Kigali City Tower.', 'KN 4 Ave, Nyarugenge', -1.9441, 30.0619, 'seed', 'seed:spar-citytower', 'approved'),
('Simba Supermarket Kimironko', NULL, 'supermarket', 'Supermarket in Kimironko.', 'KG 11 Ave, Kimironko, Gasabo', -1.9394, 30.1039, 'seed', 'seed:simba-kimironko', 'approved'),
('Super U Kimironko', NULL, 'supermarket', 'Hypermarket in Kimironko.', 'KG 11 Ave, Kimironko, Gasabo', -1.9397, 30.1042, 'seed', 'seed:super-u-kimironko', 'approved'),
('La Galette', NULL, 'supermarket', 'Supermarket in Kiyovu.', 'KN 4 Ave, Kiyovu, Nyarugenge', -1.9444, 30.0601, 'seed', 'seed:la-galette', 'approved'),

-- ---------- Markets ----------
('Kimironko Market', NULL, 'market', 'Large public market for fresh produce, fabric and household goods.', 'KG 11 Ave, Kimironko, Gasabo', -1.9394, 30.1039, 'seed', 'seed:kimironko-market', 'approved'),
('Nyabugogo Market', NULL, 'market', 'Main market near the bus terminal.', 'Nyabugogo, Nyarugenge', -1.9400, 30.0505, 'seed', 'seed:nyabugogo-market', 'approved'),
('Nyamirambo Market', NULL, 'market', 'Community market in Nyamirambo.', 'Nyamirambo, Nyarugenge', -1.9700, 30.0500, 'seed', 'seed:nyamirambo-market', 'approved'),
('Gikondo Market', NULL, 'market', 'Market in Gikondo.', 'Gikondo, Kicukiro', -1.9700, 30.0800, 'seed', 'seed:gikondo-market', 'approved'),

-- ---------- Pharmacies ----------
('Pharmacie Conseil', NULL, 'pharmacy', 'Pharmacy in central Kigali.', 'KN 2 Ave, Nyarugenge', -1.9443, 30.0610, 'seed', 'seed:pharmacie-conseil', 'approved'),
('Pharmacie Nouvelle', NULL, 'pharmacy', 'Pharmacy in Kiyovu.', 'KN 6 Ave, Kiyovu, Nyarugenge', -1.9450, 30.0607, 'seed', 'seed:pharmacie-nouvelle', 'approved'),
('Simba Pharmacy', NULL, 'pharmacy', 'Pharmacy in Kimironko.', 'KG 11 Ave, Kimironko, Gasabo', -1.9397, 30.1036, 'seed', 'seed:simba-pharmacy', 'approved'),
('Pharmacie Kigali', NULL, 'pharmacy', 'Pharmacy in Remera.', 'KG 17 Ave, Remera, Gasabo', -1.9555, 30.1050, 'seed', 'seed:pharmacie-kigali', 'approved'),
('Kipharma', NULL, 'pharmacy', 'Pharmacy chain with multiple locations.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9345, 30.0830, 'seed', 'seed:kipharma', 'approved'),

-- ---------- Hospitals ----------
('King Faisal Hospital', NULL, 'hospital', 'Major referral hospital in Kigali.', 'KG 544 St, Kacyiru, Gasabo', -1.9417, 30.0802, 'seed', 'seed:king-faisal', 'approved'),
('CHUK — Kigali University Teaching Hospital', NULL, 'hospital', 'Main public teaching hospital.', 'KN 4 Ave, Nyarugenge', -1.9512, 30.0673, 'seed', 'seed:chuk', 'approved'),
('Rwanda Military Hospital', NULL, 'hospital', 'Military referral hospital in Kanombe.', 'Kanombe, Kicukiro', -1.9588, 30.1219, 'seed', 'seed:military-hospital', 'approved'),

-- ---------- Clinics ----------
('Clinic La Colombe', NULL, 'clinic', 'Private clinic in Kigali.', 'KN 3 Rd, Nyarugenge', -1.9455, 30.0615, 'seed', 'seed:la-colombe', 'approved'),
('Legacy Clinics', NULL, 'clinic', 'Private medical clinic.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9350, 30.0825, 'seed', 'seed:legacy-clinics', 'approved'),
('Clinic Bien Naître', NULL, 'clinic', 'Maternity and medical clinic.', 'KG 11 Ave, Remera, Gasabo', -1.9510, 30.1000, 'seed', 'seed:bien-naitre', 'approved'),

-- ---------- Banks ----------
('Bank of Kigali Headquarters', NULL, 'bank', 'Main bank headquarters.', 'KN 4 Ave, Nyarugenge', -1.9441, 30.0619, 'seed', 'seed:bk-hq', 'approved'),
('I&M Bank Kigali', NULL, 'bank', 'Commercial bank branch.', 'KN 3 Rd, Nyarugenge', -1.9445, 30.0610, 'seed', 'seed:im-bank', 'approved'),
('Ecobank Kigali', NULL, 'bank', 'Commercial bank branch.', 'KN 2 Ave, Nyarugenge', -1.9447, 30.0609, 'seed', 'seed:ecobank', 'approved'),
('BPR Nyabugogo', NULL, 'bank', 'Popular bank branch near bus terminal.', 'Nyabugogo, Nyarugenge', -1.9403, 30.0503, 'seed', 'seed:bpr-nyabugogo', 'approved'),
('Equity Bank Kigali', NULL, 'bank', 'Commercial bank branch.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9345, 30.0830, 'seed', 'seed:equity-bank', 'approved'),

-- ---------- ATMs ----------
('Bank of Kigali ATM — City Tower', NULL, 'atm', 'ATM at Kigali City Tower.', 'KN 4 Ave, Nyarugenge', -1.9441, 30.0619, 'seed', 'seed:atm-bk-citytower', 'approved'),
('I&M ATM — Kigali Heights', NULL, 'atm', 'ATM at Kigali Heights mall.', 'KG 7 Ave, Kigali Heights, Gasabo', -1.9497, 30.0857, 'seed', 'seed:atm-im-heights', 'approved'),

-- ---------- Fuel ----------
('TotalEnergies Nyabugogo', NULL, 'fuel', 'Fuel station near bus terminal.', 'Nyabugogo, Nyarugenge', -1.9405, 30.0507, 'seed', 'seed:total-nyabugogo', 'approved'),
('SP Kigali — Remera', NULL, 'fuel', 'Fuel station in Remera.', 'KG 17 Ave, Remera, Gasabo', -1.9552, 30.1045, 'seed', 'seed:sp-remera', 'approved'),
('Engen Remera', NULL, 'fuel', 'Fuel station in Remera.', 'KG 11 Ave, Remera, Gasabo', -1.9530, 30.1015, 'seed', 'seed:engen-remera', 'approved'),
('Shell Avenue de l''Armée', NULL, 'fuel', 'Fuel station on Avenue de l''Armée.', 'Avenue de l''Armée, Nyarugenge', -1.9432, 30.0630, 'seed', 'seed:shell-armee', 'approved'),

-- ---------- Hotels ----------
('Kigali Serena Hotel', NULL, 'hotel', 'Luxury hotel in central Kigali.', 'KN 3 Rd, Nyarugenge', -1.9476, 30.0618, 'seed', 'seed:serena', 'approved'),
('Kigali Marriott Hotel', NULL, 'hotel', 'International hotel near convention centre.', 'KN 3 Rd, Nyarugenge', -1.9546, 30.0901, 'seed', 'seed:marriott', 'approved'),
('Radisson Blu Hotel & Convention Centre', NULL, 'hotel', 'Hotel and convention centre.', 'KG 2 Roundabout, Nyarugenge', -1.9546, 30.0901, 'seed', 'seed:radisson', 'approved'),
('Hotel des Mille Collines', NULL, 'hotel', 'Historic hotel in central Kigali.', 'KN 3 Rd, Nyarugenge', -1.9448, 30.0595, 'seed', 'seed:mille-collines', 'approved'),
('Lemigo Hotel', NULL, 'hotel', 'Hotel in Kigali.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9350, 30.0830, 'seed', 'seed:lemigo', 'approved'),
('Urban by CityBlue', NULL, 'hotel', 'Boutique hotel in Kigali.', 'KN 2 Ave, Nyarugenge', -1.9445, 30.0610, 'seed', 'seed:urban-cityblue', 'approved'),

-- ---------- Schools ----------
('Green Hills Academy', NULL, 'school', 'International school in Kigali.', 'KG 7 Ave, Nyarutarama, Gasabo', -1.9340, 30.0990, 'seed', 'seed:green-hills', 'approved'),
('Kigali International Community School', NULL, 'school', 'International school.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9340, 30.0820, 'seed', 'seed:kics', 'approved'),
('Lycée de Kigali', NULL, 'school', 'Public secondary school.', 'KN 3 Rd, Nyarugenge', -1.9450, 30.0620, 'seed', 'seed:lycee-kigali', 'approved'),
('Wellspring Academy', NULL, 'school', 'Private school.', 'KG 11 Ave, Remera, Gasabo', -1.9520, 30.1010, 'seed', 'seed:wellspring', 'approved'),

-- ---------- Universities ----------
('University of Rwanda — College of Science and Technology', NULL, 'university', 'Main public university campus.', 'KN 7 Ave, Nyarugenge', -1.9479, 30.0618, 'seed', 'seed:ur-cst', 'approved'),
('Carnegie Mellon University Africa', NULL, 'university', 'Graduate campus.', 'KG 11 Ave, Kigali Innovation City, Kicukiro', -1.9300, 30.1250, 'seed', 'seed:cmu-africa', 'approved'),
('African Leadership University', NULL, 'university', 'Private university.', 'KG 11 Ave, Kigali Innovation City, Kicukiro', -1.9305, 30.1245, 'seed', 'seed:alu', 'approved'),
('Adventist University of Central Africa', NULL, 'university', 'Private university.', 'KG 11 Ave, Kigali, Gasabo', -1.9500, 30.1000, 'seed', 'seed:auca', 'approved'),

-- ---------- Places of worship ----------
('Saint Michael Cathedral', NULL, 'place_of_worship', 'Catholic cathedral.', 'KN 4 Ave, Nyarugenge', -1.9450, 30.0590, 'seed', 'seed:st-michael', 'approved'),
('Sainte Famille Church', NULL, 'place_of_worship', 'Catholic church.', 'KN 4 Ave, Nyarugenge', -1.9452, 30.0592, 'seed', 'seed:sainte-famille', 'approved'),
('Kigali Central SDA Church', NULL, 'place_of_worship', 'Seventh-day Adventist church.', 'KN 3 Rd, Nyarugenge', -1.9450, 30.0600, 'seed', 'seed:sda-central', 'approved'),
('Kimironko Catholic Church', NULL, 'place_of_worship', 'Catholic parish church.', 'KG 11 Ave, Kimironko, Gasabo', -1.9390, 30.1040, 'seed', 'seed:kimironko-catholic', 'approved'),

-- ---------- Government ----------
('Kigali City Hall', NULL, 'government', 'City administration headquarters.', 'KN 3 Rd, Nyarugenge', -1.9444, 30.0621, 'seed', 'seed:city-hall', 'approved'),
('Nyarugenge District Office', NULL, 'government', 'District administration.', 'KN 4 Ave, Nyarugenge', -1.9450, 30.0610, 'seed', 'seed:nyarugenge-district', 'approved'),
('Gasabo District Office', NULL, 'government', 'District administration.', 'KG 7 Ave, Kacyiru, Gasabo', -1.9350, 30.0830, 'seed', 'seed:gasabo-district', 'approved'),
('Kicukiro District Office', NULL, 'government', 'District administration.', 'Kicukiro, Kicukiro', -1.9700, 30.1000, 'seed', 'seed:kicukiro-district', 'approved'),

-- ---------- Electronics ----------
('MTN Center Kigali', NULL, 'electronics', 'Telecom services and devices.', 'KN 4 Ave, Nyarugenge', -1.9443, 30.0615, 'seed', 'seed:mtn-center', 'approved'),
('Samsung Service Center', NULL, 'electronics', 'Electronics and repair.', 'KN 3 Rd, Nyarugenge', -1.9447, 30.0612, 'seed', 'seed:samsung-service', 'approved'),

-- ---------- Clothing ----------
('UTEXRWA', NULL, 'clothing', 'Textiles and clothing.', 'KN 3 Rd, Nyarugenge', -1.9450, 30.0612, 'seed', 'seed:utexrwa', 'approved'),

-- ---------- Transport ----------
('Nyabugogo Bus Terminal', NULL, 'transport', 'Main intercity and urban bus terminal.', 'Nyabugogo, Nyarugenge', -1.9397, 30.0503, 'seed', 'seed:nyabugogo-terminal', 'approved'),
('Remera Bus Park', NULL, 'transport', 'Urban bus terminal.', 'KG 11 Ave, Remera, Gasabo', -1.9510, 30.1020, 'seed', 'seed:remera-terminal', 'approved'),
('Kigali International Airport', NULL, 'transport', 'International airport.', 'KN 5 Rd, Kanombe, Kicukiro', -1.9686, 30.1395, 'seed', 'seed:kigali-airport', 'approved'),

-- ---------- Landmarks ----------
('Kigali Genocide Memorial', NULL, 'other', 'Memorial site.', 'KG 14 Ave, Gisozi, Gasabo', -1.9309, 30.0611, 'seed', 'seed:genocide-memorial', 'approved'),
('Amahoro National Stadium', NULL, 'other', 'National sports stadium.', 'KG 11 Ave, Remera, Gasabo', -1.9427, 30.1067, 'seed', 'seed:amahoro-stadium', 'approved');