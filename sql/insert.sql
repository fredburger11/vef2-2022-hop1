INSERT INTO
  users (name, username, password)
VALUES
  ('Kari', 'Klari', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii');

INSERT INTO
  users (name, username, password, admin)
VALUES
  ('Smari', 'admin','$2b$04$5XvV1IIubvtw.RI3dMmDPumdpr9GQlUM.yWVbUxaRqu/3exbw3mke', true);


INSERT INTO events (id, name, slug, description, creatorId) VALUES (1, 'Forritarahittingur í febrúar', 'forritarahittingur-i-februar', 'Forritarar hittast í febrúar og forrita saman eitthvað frábært.',1);
INSERT INTO events (id, name, slug, description, creatorId) VALUES (2, 'Hönnuðahittingur í mars', 'honnudahittingur-i-mars', 'Spennandi hittingur hönnuða í Hönnunarmars.',1);
INSERT INTO events (id, name, slug, description, creatorId) VALUES (3, 'Verkefnastjórahittingur í apríl', 'verkefnastjorahittingur-i-april', 'Virkilega vel verkefnastýrður hittingur.',1);

INSERT INTO registrations (userId, comment, event) VALUES (1,'Hlakka til að forrita með ykkur', 1);
INSERT INTO registrations (userId, comment, event) VALUES (1, null, 1);
INSERT INTO registrations (userId, comment, event) VALUES (1,'verður vefforritað?', 1);

