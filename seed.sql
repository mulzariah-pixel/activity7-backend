-- seed.sql
-- Initial demonstration records for Campus Maintenance Requests

INSERT INTO records (title, category, description, status) VALUES
('Broken fluorescent light fixture', 'Electrical', 'The ceiling fluorescent tube in Lecture Hall 2 flickers constantly and makes a buzzing sound.', 'Pending'),
('Leaking faucet in washroom', 'Plumbing', 'The cold water tap in the 2nd floor Engineering block restroom leaks heavily when turned off.', 'In progress'),
('Damaged study desk in Library', 'Furniture', 'Desk number 14 has a broken leg and wobbles severely, making it unsafe for student use.', 'Pending'),
('Air conditioner failure in Lab 3', 'Electrical', 'The main split-unit AC in Computer Lab 3 is blowing warm air and showing error code E4.', 'In progress'),
('Blocked drain outside Cafeteria', 'Plumbing', 'Rainwater drain next to the main cafeteria entrance is blocked by debris causing flooding.', 'Completed'),
('Broken whiteboard frame in Room B12', 'Furniture', 'The mounting bracket on the left side of the whiteboard has detached from the wall.', 'Pending'),
('Loose power socket at study pod', 'Electrical', 'The wall outlet near Pod 4 is loose and sparks intermittently when laptop chargers are plugged in.', 'Completed'),
('Damaged auditorium seat hinge', 'Furniture', 'Seat 45 in Row F cannot stay folded and the armrest has cracked off.', 'Pending');
