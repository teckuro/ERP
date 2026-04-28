-- ============================================================
-- INSERTS / SEED INICIAL
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

-- ============================================
-- DATOS MINIMOS DE PRUEBA
-- ============================================

INSERT INTO region (id_region, nombre, ordinal) VALUES
    (1,  'Región de Arica y Parinacota', 'XV'),
    (2,  'Región de Tarapacá', 'I'),
    (3,  'Región de Antofagasta', 'II'),
    (4,  'Región de Atacama', 'III'),
    (5,  'Región de Coquimbo', 'IV'),
    (6,  'Región de Valparaíso', 'V'),
    (7,  'Región del Libertador General Bernardo O''Higgins', 'VI'),
    (8,  'Región del Maule', 'VII'),
    (9,  'Región de Ñuble', 'XVI'),
    (10, 'Región del Biobío', 'VIII'),
    (11, 'Región de la Araucanía', 'IX'),
    (12, 'Región de Los Ríos', 'XIV'),
    (13, 'Región de Los Lagos', 'X'),
    (14, 'Región de Aysén del General Carlos Ibáñez del Campo', 'XI'),
    (15, 'Región de Magallanes y de la Antártica Chilena', 'XII'),
    (16, 'Región Metropolitana de Santiago', 'RM');

INSERT INTO provincia (id_provincia, id_region, nombre) VALUES
    (1,  1,  'Provincia de Arica'),
    (2,  1,  'Provincia de Parinacota'),
    (3,  2,  'Provincia de Iquique'),
    (4,  2,  'Provincia de Tamarugal'),
    (5,  3,  'Provincia de Antofagasta'),
    (6,  3,  'Provincia de Tocopilla'),
    (7,  3,  'Provincia de El Loa'),
    (8,  4,  'Provincia de Copiapó'),
    (9,  4,  'Provincia de Huasco'),
    (10, 4,  'Provincia de Chañaral'),
    (11, 5,  'Provincia de Choapa'),
    (12, 5,  'Provincia de Elqui'),
    (13, 5,  'Provincia de Limarí'),
    (14, 6,  'Provincia de Isla de Pascua'),
    (15, 6,  'Provincia de Los Andes'),
    (16, 6,  'Provincia de Quillota'),
    (17, 6,  'Provincia de Valparaíso'),
    (18, 6,  'Provincia de Petorca'),
    (19, 6,  'Provincia de San Antonio'),
    (20, 6,  'Provincia de San Felipe de Aconcagua'),
    (21, 6,  'Provincia de Marga Marga'),
    (22, 7,  'Provincia de Cachapoal'),
    (23, 7,  'Provincia de Cardenal Caro'),
    (24, 7,  'Provincia de Colchagua'),
    (25, 8,  'Provincia de Linares'),
    (26, 8,  'Provincia de Curicó'),
    (27, 8,  'Provincia de Cauquenes'),
    (28, 8,  'Provincia de Talca'),
    (29, 9,  'Provincia de Itata'),
    (30, 9,  'Provincia de Punilla'),
    (31, 9,  'Provincia de Diguillín'),
    (32, 10, 'Provincia de Concepción'),
    (33, 10, 'Provincia de Arauco'),
    (34, 10, 'Provincia de Biobío'),
    (35, 11, 'Provincia de Malleco'),
    (36, 11, 'Provincia de Cautín'),
    (37, 12, 'Provincia de Valdivia'),
    (38, 12, 'Provincia de Ranco'),
    (39, 13, 'Provincia de Chiloé'),
    (40, 13, 'Provincia de Osorno'),
    (41, 13, 'Provincia de Llanquihue'),
    (42, 13, 'Provincia de Palena'),
    (43, 14, 'Provincia de Aysén'),
    (44, 14, 'Provincia de Coyhaique'),
    (45, 14, 'Provincia de Capitán Prat'),
    (46, 14, 'Provincia de General Carrera'),
    (47, 15, 'Provincia de Tierra del Fuego'),
    (48, 15, 'Provincia de Magallanes'),
    (49, 15, 'Provincia de Última Esperanza'),
    (50, 15, 'Provincia de Antártica Chilena'),
    (51, 16, 'Provincia de Talagante'),
    (52, 16, 'Provincia de Santiago'),
    (53, 16, 'Provincia de Chacabuco'),
    (54, 16, 'Provincia de Cordillera'),
    (55, 16, 'Provincia de Maipo'),
    (56, 16, 'Provincia de Melipilla');

INSERT INTO comuna (id_comuna, id_provincia, nombre) VALUES
    (1,   1,  'Arica'),
    (2,   1,  'Camarones'),
    (3,   2,  'Putre'),
    (4,   2,  'General Lagos'),
    (5,   3,  'Alto Hospicio'),
    (6,   3,  'Iquique'),
    (7,   4,  'Pica'),
    (8,   4,  'Huara'),
    (9,   4,  'Colchane'),
    (10,  4,  'Camiña'),
    (11,  4,  'Pozo Almonte'),
    (12,  5,  'Taltal'),
    (13,  5,  'Sierra Gorda'),
    (14,  5,  'Mejillones'),
    (15,  5,  'Antofagasta'),
    (16,  6,  'María Elena'),
    (17,  6,  'Tocopilla'),
    (18,  7,  'San Pedro de Atacama'),
    (19,  7,  'Ollagüe'),
    (20,  7,  'Calama'),
    (21,  8,  'Tierra Amarilla'),
    (22,  8,  'Caldera'),
    (23,  8,  'Copiapó'),
    (24,  9,  'Huasco'),
    (25,  9,  'Freirina'),
    (26,  9,  'Alto del Carmen'),
    (27,  9,  'Vallenar'),
    (28,  10, 'Chañaral'),
    (29,  10, 'Diego de Almagro'),
    (30,  11, 'Illapel'),
    (31,  11, 'Canela'),
    (32,  11, 'Los Vilos'),
    (33,  11, 'Salamanca'),
    (34,  12, 'La Serena'),
    (35,  12, 'Coquimbo'),
    (36,  12, 'Andacollo'),
    (37,  12, 'La Higuera'),
    (38,  12, 'Paihuano'),
    (39,  12, 'Vicuña'),
    (40,  13, 'Ovalle'),
    (41,  13, 'Combarbalá'),
    (42,  13, 'Monte Patria'),
    (43,  13, 'Punitaqui'),
    (44,  13, 'Río Hurtado'),
    (45,  14, 'Isla de Pascua'),
    (46,  15, 'Los Andes'),
    (47,  15, 'Calle Larga'),
    (48,  15, 'Rinconada'),
    (49,  15, 'San Esteban'),
    (50,  16, 'Quillota'),
    (51,  16, 'La Calera'),
    (52,  16, 'Hijuelas'),
    (53,  16, 'La Cruz'),
    (54,  16, 'Nogales'),
    (55,  17, 'Valparaíso'),
    (56,  17, 'Casablanca'),
    (57,  17, 'Concón'),
    (58,  17, 'Juan Fernández'),
    (59,  17, 'Puchuncaví'),
    (60,  17, 'Quintero'),
    (61,  17, 'Viña del Mar'),
    (62,  18, 'La Ligua'),
    (63,  18, 'Cabildo'),
    (64,  18, 'Papudo'),
    (65,  18, 'Petorca'),
    (66,  18, 'Zapallar'),
    (67,  19, 'San Antonio'),
    (68,  19, 'Algarrobo'),
    (69,  19, 'Cartagena'),
    (70,  19, 'El Quisco'),
    (71,  19, 'El Tabo'),
    (72,  19, 'Santo Domingo'),
    (73,  20, 'San Felipe'),
    (74,  20, 'Catemu'),
    (75,  20, 'Llaillay'),
    (76,  20, 'Panquehue'),
    (77,  20, 'Putaendo'),
    (78,  20, 'Santa María'),
    (79,  21, 'Quilpué'),
    (80,  21, 'Limache'),
    (81,  21, 'Olmué'),
    (82,  21, 'Villa Alemana'),
    (83,  22, 'Rancagua'),
    (84,  22, 'Codegua'),
    (85,  22, 'Coinco'),
    (86,  22, 'Coltauco'),
    (87,  22, 'Doñihue'),
    (88,  22, 'Graneros'),
    (89,  22, 'Las Cabras'),
    (90,  22, 'Machalí'),
    (91,  22, 'Malloa'),
    (92,  22, 'Mostazal'),
    (93,  22, 'Olivar'),
    (94,  22, 'Peumo'),
    (95,  22, 'Pichidegua'),
    (96,  22, 'Quinta de Tilcoco'),
    (97,  22, 'Rengo'),
    (98,  22, 'Requínoa'),
    (99,  22, 'San Vicente'),
    (100, 23, 'Navidad'),
    (101, 23, 'Paredones'),
    (102, 23, 'Pichilemu'),
    (103, 23, 'La Estrella'),
    (104, 23, 'Litueche'),
    (105, 23, 'Marchihue'),
    (106, 24, 'San Fernando'),
    (107, 24, 'Chépica'),
    (108, 24, 'Chimbarongo'),
    (109, 24, 'Lolol'),
    (110, 24, 'Nancagua'),
    (111, 24, 'Palmilla'),
    (112, 24, 'Peralillo'),
    (113, 24, 'Placilla'),
    (114, 24, 'Pumanque'),
    (115, 24, 'Santa Cruz'),
    (116, 25, 'Parral'),
    (117, 25, 'Linares'),
    (118, 25, 'Colbún'),
    (119, 25, 'Longaví'),
    (120, 25, 'Retiro'),
    (121, 25, 'San Javier'),
    (122, 25, 'Villa Alegre'),
    (123, 25, 'Yerbas Buenas'),
    (124, 26, 'Curicó'),
    (125, 26, 'Hualañé'),
    (126, 26, 'Licantén'),
    (127, 26, 'Molina'),
    (128, 26, 'Rauco'),
    (129, 26, 'Romeral'),
    (130, 26, 'Sagrada Familia'),
    (131, 26, 'Teno'),
    (132, 26, 'Vichuquén'),
    (133, 27, 'Cauquenes'),
    (134, 27, 'Chanco'),
    (135, 27, 'Pelluhue'),
    (136, 28, 'Talca'),
    (137, 28, 'Constitución'),
    (138, 28, 'Curepto'),
    (139, 28, 'Empedrado'),
    (140, 28, 'Maule'),
    (141, 28, 'Pelarco'),
    (142, 28, 'Pencahue'),
    (143, 28, 'Río Claro'),
    (144, 28, 'San Clemente'),
    (145, 28, 'San Rafael'),
    (146, 29, 'Quirihue'),
    (147, 29, 'Cobquecura'),
    (148, 29, 'Coelemu'),
    (149, 29, 'Ninhue'),
    (150, 29, 'Portezuelo'),
    (151, 29, 'Ránquil'),
    (152, 29, 'Treguaco'),
    (153, 30, 'San Carlos'),
    (154, 30, 'Coihueco'),
    (155, 30, 'Ñiquén'),
    (156, 30, 'San Fabián'),
    (157, 30, 'San Nicolás'),
    (158, 31, 'Chillán'),
    (159, 31, 'Bulnes'),
    (160, 31, 'Chillán Viejo'),
    (161, 31, 'El Carmen'),
    (162, 31, 'Pemuco'),
    (163, 31, 'Pinto'),
    (164, 31, 'Quillón'),
    (165, 31, 'San Ignacio'),
    (166, 31, 'Yungay'),
    (167, 32, 'Concepción'),
    (168, 32, 'Coronel'),
    (169, 32, 'Chiguayante'),
    (170, 32, 'Florida'),
    (171, 32, 'Hualqui'),
    (172, 32, 'Lota'),
    (173, 32, 'Penco'),
    (174, 32, 'San Pedro de la Paz'),
    (175, 32, 'Santa Juana'),
    (176, 32, 'Talcahuano'),
    (177, 32, 'Tomé'),
    (178, 32, 'Hualpén'),
    (179, 33, 'Lebu'),
    (180, 33, 'Arauco'),
    (181, 33, 'Cañete'),
    (182, 33, 'Contulmo'),
    (183, 33, 'Curanilahue'),
    (184, 33, 'Los Álamos'),
    (185, 33, 'Tirúa'),
    (186, 34, 'Los Ángeles'),
    (187, 34, 'Antuco'),
    (188, 34, 'Laja'),
    (189, 34, 'Mulchén'),
    (190, 34, 'Nacimiento'),
    (191, 34, 'Negrete'),
    (192, 34, 'Quilaco'),
    (193, 34, 'Quilleco'),
    (194, 34, 'San Rosendo'),
    (195, 34, 'Santa Bárbara'),
    (196, 34, 'Tucapel'),
    (197, 34, 'Alto Biobío'),
    (198, 34, 'Cabrero'),
    (199, 34, 'Yumbel'),
    (200, 35, 'Purén'),
    (201, 35, 'Ercilla'),
    (202, 35, 'Renaico'),
    (203, 35, 'Traiguén'),
    (204, 35, 'Angol'),
    (205, 35, 'Collipulli'),
    (206, 35, 'Curacautín'),
    (207, 35, 'Lonquimay'),
    (208, 35, 'Los Sauces'),
    (209, 35, 'Lumaco'),
    (210, 35, 'Victoria'),
    (211, 36, 'Gorbea'),
    (212, 36, 'Lautaro'),
    (213, 36, 'Loncoche'),
    (214, 36, 'Melipeuco'),
    (215, 36, 'Nueva Imperial'),
    (216, 36, 'Padre las Casas'),
    (217, 36, 'Perquenco'),
    (218, 36, 'Pitrufquén'),
    (219, 36, 'Pucón'),
    (220, 36, 'Saavedra'),
    (221, 36, 'Teodoro Schmidt'),
    (222, 36, 'Toltén'),
    (223, 36, 'Vilcún'),
    (224, 36, 'Villarrica'),
    (225, 36, 'Cholchol'),
    (226, 36, 'Temuco'),
    (227, 36, 'Carahue'),
    (228, 36, 'Cunco'),
    (229, 36, 'Curarrehue'),
    (230, 36, 'Freire'),
    (231, 36, 'Galvarino'),
    (232, 37, 'Valdivia'),
    (233, 37, 'Corral'),
    (234, 37, 'Lanco'),
    (235, 37, 'Los Lagos'),
    (236, 37, 'Máfil'),
    (237, 37, 'Mariquina'),
    (238, 37, 'Paillaco'),
    (239, 37, 'Panguipulli'),
    (240, 38, 'La Unión'),
    (241, 38, 'Futrono'),
    (242, 38, 'Lago Ranco'),
    (243, 38, 'Río Bueno'),
    (244, 39, 'Quinchao'),
    (245, 39, 'Castro'),
    (246, 39, 'Ancud'),
    (247, 39, 'Chonchi'),
    (248, 39, 'Curaco de Vélez'),
    (249, 39, 'Dalcahue'),
    (250, 39, 'Puqueldón'),
    (251, 39, 'Queilén'),
    (252, 39, 'Quellón'),
    (253, 39, 'Quemchi'),
    (254, 40, 'Río Negro'),
    (255, 40, 'Osorno'),
    (256, 40, 'Puerto Octay'),
    (257, 40, 'Purranque'),
    (258, 40, 'Puyehue'),
    (259, 40, 'San Juan de la Costa'),
    (260, 40, 'San Pablo'),
    (261, 41, 'Puerto Montt'),
    (262, 41, 'Calbuco'),
    (263, 41, 'Cochamó'),
    (264, 41, 'Fresia'),
    (265, 41, 'Frutillar'),
    (266, 41, 'Los Muermos'),
    (267, 41, 'Llanquihue'),
    (268, 41, 'Maullín'),
    (269, 41, 'Puerto Varas'),
    (270, 42, 'Chaitén'),
    (271, 42, 'Futaleufú'),
    (272, 42, 'Hualaihué'),
    (273, 42, 'Palena'),
    (274, 43, 'Aysén'),
    (275, 43, 'Cisnes'),
    (276, 43, 'Guaitecas'),
    (277, 44, 'Lago Verde'),
    (278, 44, 'Coyhaique'),
    (279, 45, 'Cochrane'),
    (280, 45, 'O''Higgins'),
    (281, 45, 'Tortel'),
    (282, 46, 'Chile Chico'),
    (283, 46, 'Río Ibáñez'),
    (284, 47, 'Porvenir'),
    (285, 47, 'Primavera'),
    (286, 47, 'Timaukel'),
    (287, 48, 'Punta Arenas'),
    (288, 48, 'Laguna Blanca'),
    (289, 48, 'Río Verde'),
    (290, 48, 'San Gregorio'),
    (291, 49, 'Natales'),
    (292, 49, 'Torres del Paine'),
    (293, 50, 'Cabo de Hornos'),
    (294, 50, 'Antártica'),
    (295, 51, 'Talagante'),
    (296, 51, 'El Monte'),
    (297, 51, 'Isla de Maipo'),
    (298, 51, 'Padre Hurtado'),
    (299, 51, 'Peñaflor'),
    (300, 52, 'La Pintana'),
    (301, 52, 'La Reina'),
    (302, 52, 'Las Condes'),
    (303, 52, 'Lo Barnechea'),
    (304, 52, 'Lo Espejo'),
    (305, 52, 'Lo Prado'),
    (306, 52, 'Macul'),
    (307, 52, 'Maipú'),
    (308, 52, 'Ñuñoa'),
    (309, 52, 'Pedro Aguirre Cerda'),
    (310, 52, 'Peñalolén'),
    (311, 52, 'Providencia'),
    (312, 52, 'Pudahuel'),
    (313, 52, 'Quilicura'),
    (314, 52, 'Quinta Normal'),
    (315, 52, 'Recoleta'),
    (316, 52, 'Renca'),
    (317, 52, 'San Joaquín'),
    (318, 52, 'San Miguel'),
    (319, 52, 'San Ramón'),
    (320, 52, 'Vitacura'),
    (321, 52, 'Santiago'),
    (322, 52, 'Cerrillos'),
    (323, 52, 'Cerro Navia'),
    (324, 52, 'Conchalí'),
    (325, 52, 'El Bosque'),
    (326, 52, 'Estación Central'),
    (327, 52, 'Huechuraba'),
    (328, 52, 'Independencia'),
    (329, 52, 'La Cisterna'),
    (330, 52, 'La Florida'),
    (331, 52, 'La Granja'),
    (332, 53, 'Colina'),
    (333, 53, 'Lampa'),
    (334, 53, 'Tiltil'),
    (335, 54, 'Puente Alto'),
    (336, 54, 'Pirque'),
    (337, 54, 'San José de Maipo'),
    (338, 55, 'San Bernardo'),
    (339, 55, 'Buin'),
    (340, 55, 'Calera de Tango'),
    (341, 55, 'Paine'),
    (342, 56, 'Melipilla'),
    (343, 56, 'Alhué'),
    (344, 56, 'Curacaví'),
    (345, 56, 'María Pinto'),
    (346, 56, 'San Pedro');

INSERT INTO ciudad (id_ciudad, id_comuna, nombre) VALUES
    (1, 321, 'Santiago')
ON CONFLICT (id_ciudad) DO NOTHING;

INSERT INTO banco (
    codigo_sbif,
    nombre,
    nombre_corto,
    es_banco_estado,
    es_banco_extranjero,
    activo
)
VALUES
    ('001', 'BANCO DE CHILE', 'Banco de Chile', FALSE, FALSE, TRUE),
    ('009', 'BANCO INTERNACIONAL', 'Banco Internacional', FALSE, FALSE, TRUE),
    ('012', 'BANCO DEL ESTADO DE CHILE', 'BancoEstado', TRUE, FALSE, TRUE),
    ('014', 'SCOTIABANK CHILE', 'Scotiabank', FALSE, FALSE, TRUE),
    ('016', 'BANCO DE CREDITO E INVERSIONES', 'BCI', FALSE, FALSE, TRUE),
    ('028', 'BANCO BICE', 'BICE', FALSE, FALSE, TRUE),
    ('031', 'HSBC BANK CHILE', 'HSBC', FALSE, FALSE, TRUE),
    ('037', 'BANCO SANTANDER-CHILE', 'Santander', FALSE, FALSE, TRUE),
    ('039', 'BANCO ITAÚ CHILE', 'Itaú', FALSE, FALSE, TRUE),
    ('041', 'JP MORGAN CHASE BANK N.A.', 'JP Morgan', FALSE, TRUE, TRUE),
    ('051', 'BANCO FALABELLA', 'Falabella', FALSE, FALSE, TRUE),
    ('053', 'BANCO RIPLEY', 'Ripley', FALSE, FALSE, TRUE),
    ('055', 'BANCO CONSORCIO', 'Consorcio', FALSE, FALSE, TRUE),
    ('059', 'BANCO BTG PACTUAL CHILE', 'BTG Pactual', FALSE, FALSE, TRUE),
    ('060', 'CHINA CONSTRUCTION BANK AGENCIA EN CHILE', 'China Construction Bank', FALSE, TRUE, TRUE),
    ('061', 'BANK OF CHINA AGENCIA EN CHILE', 'Bank of China', FALSE, TRUE, TRUE),
    ('062', 'TANNER BANCO DIGITAL', 'Tanner Banco Digital', FALSE, FALSE, TRUE),
    ('063', 'TENPO BANK CHILE', 'Tenpo Bank', FALSE, FALSE, TRUE)
ON CONFLICT (codigo_sbif) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    nombre_corto = EXCLUDED.nombre_corto,
    es_banco_estado = EXCLUDED.es_banco_estado,
    es_banco_extranjero = EXCLUDED.es_banco_extranjero,
    activo = EXCLUDED.activo,
    updated_at = NOW();

INSERT INTO regimen_previsional (id_regimen, nombre) VALUES
    (1, 'AFP'),
    (2, 'IPS')
ON CONFLICT (id_regimen) DO NOTHING;

INSERT INTO entidad_previsional_ips (nombre, vigente) VALUES
    ('IPS (Ex-INP)', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente) VALUES
    ('Empart', TRUE),
    ('Bancaria', TRUE),
    ('Triomar', TRUE),
    ('Hípica Nacional', TRUE),
    ('Servicios de Seguro Social', TRUE),
    ('Empleados de Emos', TRUE),
    ('Obreros de Emos', TRUE),
    ('Caja Ferro', TRUE),
    ('Canaempu: Periodistas', TRUE),
    ('Caja de Previsión Social de los EE', TRUE),
    ('OO Municipales de la Republica', TRUE),
    ('Sección Esp.Previsión Empleados', TRUE),
    ('Caja de Previsión de Gildemeister', TRUE),
    ('Mauricio, Hochschild', TRUE),
    ('Secgasco', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (
    id_ex_caja_previsional,
    nombre,
    tasa_cotizacion_referencia,
    vigente
)
SELECT
    excaja.id_ex_caja_previsional,
    seed.nombre_regimen,
    seed.tasa_cotizacion_referencia,
    TRUE
FROM (
    VALUES
        ('Empart', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Empart', 'Régimen 6', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 14', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 21', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 34', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Servicios de Seguro Social', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Servicios de Seguro Social', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Empleados de Emos', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Obreros de Emos', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 5', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 7', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 5', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 6', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 7', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 8', NULL::NUMERIC(7,4)),
        ('Caja de Previsión Social de los EE', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja de Previsión Social de los EE', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Sección Esp.Previsión Empleados', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Sección Esp.Previsión Empleados', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Caja de Previsión de Gildemeister', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja de Previsión de Gildemeister', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Mauricio, Hochschild', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Mauricio, Hochschild', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Secgasco', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Secgasco', 'Régimen 2', NULL::NUMERIC(7,4))
) AS seed(nombre_ex_caja, nombre_regimen, tasa_cotizacion_referencia)
JOIN ex_caja_previsional excaja
    ON excaja.nombre = seed.nombre_ex_caja
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO tipo_trabajador (id_tipo_trabajador, nombre) VALUES
    (1, 'DEPENDIENTE'),
    (2, 'INDEPENDIENTE')
ON CONFLICT (id_tipo_trabajador) DO NOTHING;

INSERT INTO tipo_jornada (id_tipo_jornada, nombre) VALUES
    (1, 'COMPLETA'),
    (2, 'PARCIAL')
ON CONFLICT (id_tipo_jornada) DO NOTHING;

INSERT INTO moneda (id_moneda, codigo, nombre, simbolo) VALUES
    (1, 'CLP', 'Peso Chileno', '$'),
    (2, 'UF', 'Unidad de Fomento', 'UF')
ON CONFLICT (id_moneda) DO NOTHING;

INSERT INTO tipo_cuenta_bancaria (
    codigo,
    nombre,
    activo
)
VALUES
    ('CUENTA_CORRIENTE', 'Cuenta Corriente', TRUE),
    ('CUENTA_VISTA', 'Cuenta Vista', TRUE),
    ('CUENTA_RUT', 'Cuenta RUT', TRUE),
    ('CUENTA_AHORRO', 'Cuenta de Ahorro', TRUE),
    ('CHEQUERA_ELECTRONICA', 'Chequera Electrónica', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    activo = EXCLUDED.activo,
    updated_at = NOW();

INSERT INTO institucion_apv (codigo, nombre, vigente) VALUES
    ('000', 'No Cotiza A.P.V.', TRUE),
    ('003', 'Cuprum', TRUE),
    ('005', 'Habitat', TRUE),
    ('008', 'Provida', TRUE),
    ('029', 'Planvital', TRUE),
    ('033', 'Capital', TRUE),
    ('034', 'Modelo', TRUE),
    ('035', 'Uno', TRUE),
    ('102', 'SANTANDER SEGUROS DE VIDA S.A.', TRUE),
    ('103', 'BCI SEGUROS VIDA S.A.', TRUE),
    ('106', 'BICE VIDA COMPANIA DE SEGUROS S.A.', TRUE),
    ('107', 'ZURICH CHILE SEGUROS DE VIDA.', TRUE),
    ('111', 'CIA DE SEG. DE VIDA CONSORCIO NACIONAL DE SEG S.A.', TRUE),
    ('116', 'COMPANIA DE SEGUROS CONFUTURO S.A.', TRUE),
    ('118', 'SEGUROS DE VIDA SURA S.A.', TRUE),
    ('121', 'METLIFE CHILE SEGUROS DE VIDA S.A.', TRUE),
    ('128', 'OHIO NATIONAL SEGUROS DE VIDA S.A.', TRUE),
    ('129', 'PRINCIPAL COMPANIA DE SEGUROS DE VIDA CHILE S.A.', TRUE),
    ('131', 'SEGUROS DE VIDA SECURITY PREVISION S.A.', TRUE),
    ('137', 'PRUDENTIAL AGF. (APV)', TRUE),
    ('151', 'CREDICORP CAPITAL ASSET MANAGMENT S.A AGF', TRUE),
    ('204', 'BCI ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('205', 'BICE INVERSIONES AGF S.A.', TRUE),
    ('208', 'BTG PACTUAL CHILE S.A. ADMINISTRADORA GENERAL DE FONDOS', TRUE),
    ('214', 'PRINCIPAL ASSET MANAGEMENT AGF S.A.', TRUE),
    ('215', 'SANTANDER ASSET MANAGEMENT S.A. ADM. GENERAL DE FONDOS', TRUE),
    ('217', 'SCOTIA SUDAMERICANO ADMINISTRADORA DE FONDOS MUTUOS S.A.', TRUE),
    ('218', 'ADMINISTRADORA GENERAL DE FONDOS SECURITY S.A.', TRUE),
    ('225', 'ITAU ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('229', 'BANCOESTADO S.A. ADMINISTRADORA GENERAL DE FONDOS', TRUE),
    ('237', 'FINTUAL ADMINISTRADORA GENERAL DE FONDOS S.A', TRUE),
    ('238', 'FOCUS AGF S.A.', TRUE),
    ('600', 'ZURICH CHILE ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A', TRUE),
    ('601', 'LARRAIN VIAL ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('213', 'LARRAIN VIAL S.A. CORREDORA DE BOLSA', TRUE),
    ('222', 'BANCHILE CORREDORES DE BOLSA S.A.', TRUE),
    ('227', 'CORREDORES DE BOLSA SURA S.A.', TRUE),
    ('228', 'BTG PACTUAL CHILE S.A. CORREDORES DE BOLSA', TRUE),
    ('232', 'BICE INVERSIONES CORREDORES DE BOLSA S.A.', TRUE),
    ('235', 'MBI CORREDORES DE BOLSA S.A.', TRUE),
    ('236', 'CONSORCIO CORREDORES DE BOLSA S.A.', TRUE),
    ('240', 'FINANZAS Y NEGOCIOS S.A. CORREDORES DE BOLSA', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    vigente = EXCLUDED.vigente;

INSERT INTO forma_pago_apv (codigo, nombre, vigente) VALUES
    ('1', 'Directa', TRUE),
    ('2', 'Indirecta', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    vigente = EXCLUDED.vigente;

INSERT INTO centro_costo (id_centro_costo, codigo, nombre) VALUES
    (1, 'ADM', 'Administracion')
ON CONFLICT (id_centro_costo) DO NOTHING;

INSERT INTO trabajo_pesado_parametro (
    codigo, periodo, nombre, tasa_trabajador, tasa_empleador, tasa_total,
    requiere_dictamen_cen, fuente, vigente, vigencia_inicio
) VALUES
    ('PESADO', '2025-08', 'Trabajo pesado', 2.0000, 2.0000, 4.0000, TRUE, 'https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4282.html', TRUE, DATE '2025-08-01'),
    ('MENOS_PESADO', '2025-08', 'Trabajo pesado con menor desgaste relativo', 1.0000, 1.0000, 2.0000, TRUE, 'https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4282.html', TRUE, DATE '2025-08-01')
ON CONFLICT (codigo, periodo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tasa_trabajador = EXCLUDED.tasa_trabajador,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tasa_total = EXCLUDED.tasa_total,
    requiere_dictamen_cen = EXCLUDED.requiere_dictamen_cen,
    fuente = EXCLUDED.fuente,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio;

INSERT INTO reforma_previsional_parametro (
    vigencia_inicio, vigencia_fin, aporte_empleador_total,
    cuenta_capitalizacion_individual, fapp_seguro_social, fuente, periodo
) VALUES (
    DATE '2025-08-01',
    DATE '2026-07-31',
    1.0000,
    0.1000,
    0.9000,
    'https://www.spensiones.cl/portal/institucional/594/w3-article-16615.html',
    '2025-08'
)
ON CONFLICT (vigencia_inicio) DO UPDATE SET
    vigencia_fin = EXCLUDED.vigencia_fin,
    aporte_empleador_total = EXCLUDED.aporte_empleador_total,
    cuenta_capitalizacion_individual = EXCLUDED.cuenta_capitalizacion_individual,
    fapp_seguro_social = EXCLUDED.fapp_seguro_social,
    fuente = EXCLUDED.fuente;

INSERT INTO ley_16744_parametros (
    codigo, periodo, cotizacion_basica_empleador, descripcion_tasa_adicional,
    fuente_financiamiento, fuente_organismos, vigente, vigencia_inicio
) VALUES (
    'LEY_16744_BASE',
    '2026-04',
    0.9000,
    'depende de actividad/siniestralidad de la empresa',
    'https://www.suseso.cl/606/w3-article-18613.html',
    'https://www.suseso.cl/606/w3-article-19892.html',
    TRUE,
    DATE '2026-04-01'
)
ON CONFLICT (codigo, periodo) DO UPDATE SET
    cotizacion_basica_empleador = EXCLUDED.cotizacion_basica_empleador,
    descripcion_tasa_adicional = EXCLUDED.descripcion_tasa_adicional,
    fuente_financiamiento = EXCLUDED.fuente_financiamiento,
    fuente_organismos = EXCLUDED.fuente_organismos,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio;

INSERT INTO organismo_administrador_ley_16744 (codigo, nombre, tipo, vigente) VALUES
    ('ACHS', 'Asociacion Chilena de Seguridad', 'MUTUALIDAD', TRUE),
    ('MUSEG', 'Mutual de Seguridad de la Camara Chilena de la Construccion', 'MUTUALIDAD', TRUE),
    ('IST', 'Instituto de Seguridad del Trabajo', 'MUTUALIDAD', TRUE),
    ('ISL', 'Instituto de Seguridad Laboral', 'PUBLICO', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    vigente = EXCLUDED.vigente;

INSERT INTO ccaf_entidad (codigo, nombre, vigente, fuente) VALUES
    ('LOS_ANDES', 'CCAF Los Andes', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('LA_ARAUCANA', 'CCAF La Araucana', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('LOS_HEROES', 'CCAF Los Heroes', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('18_SEPTIEMBRE', 'CCAF 18 de Septiembre', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    vigente = EXCLUDED.vigente,
    fuente = EXCLUDED.fuente;

INSERT INTO empresa (id_empresa, rut, dv, razon_social) VALUES
    (1, '12345678', '9', 'Empresa Prueba')
ON CONFLICT (id_empresa) DO NOTHING;

INSERT INTO empresa_ley_16744 (
    id_empresa, id_organismo_administrador_ley_16744,
    tasa_adicional_diferenciada, actividad_economica,
    fuente_resolucion_o_certificado, vigencia_inicio
)
SELECT
    e.id_empresa,
    o.id_organismo_administrador_ley_16744,
    0.0000,
    NULL,
    NULL,
    DATE '2026-04-01'
FROM empresa e
LEFT JOIN organismo_administrador_ley_16744 o ON o.codigo = 'ISL'
WHERE e.id_empresa = 1
ON CONFLICT (id_empresa, vigencia_inicio) DO NOTHING;

INSERT INTO sucursal (id_sucursal, id_empresa, codigo, nombre, direccion) VALUES
    (1, 1, 'MAT', 'Casa Matriz', 'Av. Central 100')
ON CONFLICT (id_sucursal) DO NOTHING;

INSERT INTO departamento_empresa (id_departamento_empresa, id_empresa, id_sucursal, codigo, nombre) VALUES
    (1, 1, 1, 'ADM', 'Administracion')
ON CONFLICT (id_departamento_empresa) DO NOTHING;

INSERT INTO afp (id_afp, nombre, tasa_obligatoria, comision, sis, tasa_empleador, vigente, forma_pago_apvi, vigencia_inicio, periodo) VALUES
    (1, 'AFP Modelo', 10.00, 1.45, 1.26, 0.00, TRUE, 1, '2024-01-01', '2024-01')
ON CONFLICT (id_afp) DO NOTHING;

INSERT INTO salud (id_salud, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, periodo) VALUES
    (1, 'FONASA', 'FONASA', 7.00, TRUE, '2024-01-01', '2024-01')
ON CONFLICT (id_salud) DO NOTHING;

INSERT INTO afp_vigencia (
    id_afp,
    tasa_obligatoria,
    comision,
    sis,
    tasa_empleador,
    forma_pago_apvi,
    vigente,
    vigencia_inicio,
    vigencia_fin
)
SELECT
    a.id_afp,
    a.tasa_obligatoria,
    a.comision,
    a.sis,
    a.tasa_empleador,
    a.forma_pago_apvi,
    a.vigente,
    COALESCE(a.vigencia_inicio, DATE '2024-01-01'),
    a.vigencia_fin
FROM afp a
WHERE NOT EXISTS (
    SELECT 1
    FROM afp_vigencia av
    WHERE av.id_afp = a.id_afp
      AND av.vigencia_inicio = COALESCE(a.vigencia_inicio, DATE '2024-01-01')
);

INSERT INTO salud_plan (
    id_salud_plan,
    id_salud,
    codigo,
    nombre,
    id_moneda,
    valor_referencia,
    adicional_ges_referencia,
    porcentaje_legal,
    vigente,
    vigencia_inicio
) VALUES
    (1, 1, 'FONASA_GENERAL', 'Fonasa general', 1, 0, 0, 7.00, TRUE, '2024-01-01')
ON CONFLICT (id_salud_plan) DO NOTHING;

INSERT INTO afc_parametro (
    codigo_tipo_contrato,
    aplica_seguro,
    aplica_trabajador,
    tasa_trabajador,
    tasa_empleador,
    vigencia_inicio,
    observacion,
    periodo
) VALUES
    ('INDEFINIDO', TRUE, TRUE, 0.60, 2.40, '2024-01-01', 'Seed base v6.11', '2024-01'),
    ('PLAZO_FIJO', TRUE, FALSE, 0.00, 3.00, '2024-01-01', 'Seed base v6.11', '2024-01'),
    ('OBRA_SERVICIO', TRUE, FALSE, 0.00, 3.00, '2024-01-01', 'Seed base v6.11', '2024-01'),
    ('CASA_PARTICULAR', TRUE, FALSE, 0.00, 3.00, '2024-01-01', 'Seed base v6.11', '2024-01')
ON CONFLICT (codigo_tipo_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento,
    codigo,
    nombre,
    afecta_dias_trabajados,
    afecta_horas,
    activo
) VALUES
    (1, 'MANUAL', 'Manual', FALSE, FALSE, TRUE),
    (2, 'HORAS_EXTRAS', 'Horas extras', FALSE, TRUE, TRUE),
    (3, 'INASISTENCIA', 'Inasistencia', TRUE, FALSE, TRUE)
ON CONFLICT (id_tipo_movimiento) DO NOTHING;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia,
    codigo,
    nombre,
    descuenta_dias,
    activo
) VALUES
    (101, 'LICENCIA_MEDICA', 'Licencia medica', TRUE, TRUE)
ON CONFLICT (id_motivo_inasistencia) DO NOTHING;

INSERT INTO tramo_carga (periodo, desde, hasta, valor, tramo)
SELECT v.periodo, v.desde, v.hasta, v.valor, v.tramo
FROM (
    VALUES
        ('2024-01', 0, 539328, 20628, 'A'),
        ('2024-01', 539329, 787746, 12667, 'B'),
        ('2024-01', 787747, 1228292, 4003, 'C')
) AS v(periodo, desde, hasta, valor, tramo)
WHERE NOT EXISTS (
    SELECT 1
    FROM tramo_carga tc
    WHERE tc.periodo = v.periodo
      AND tc.tramo = v.tramo
);

INSERT INTO persona (
    id_persona,
    rut,
    dv,
    nombres,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    sexo,
    id_pais,
    estado_civil,
    email,
    telefono,
    pasaporte,
    id_comuna,
    direccion,
    numero_direccion,
    departamento_direccion,
    id_tramo_carga,
    casa,
    villa,
    poblacion,
    observaciones_direccion,
    fax,
    cargas,
    estado_ficha,
    estado
) VALUES (
    1,
    '11222333',
    '4',
    'Juan',
    'Perez',
    'Gonzalez',
    '1980-01-01',
    'M',
    (
        SELECT id_pais
        FROM public.pais
        WHERE codigo_iso2 = 'CL'
        LIMIT 1
    ),
    'SOLTERO',
    'juan.perez@empresa.cl',
    '+56911111111',
    NULL,
    (
        SELECT c.id_comuna
        FROM comuna c
        JOIN provincia p
            ON p.id_provincia = c.id_provincia
        JOIN region r
            ON r.id_region = p.id_region
        WHERE c.nombre = 'Santiago'
          AND p.id_provincia = 52
          AND r.id_region = 16
        ORDER BY c.id_comuna
        LIMIT 1
    ),
    'Av. Prueba 123',
    '123',
    '402',
    (
        SELECT tc.id_tramo
        FROM tramo_carga tc
        WHERE tc.periodo = '2024-01'
          AND tc.tramo = 'B'
        ORDER BY tc.id_tramo
        LIMIT 1
    ),
    NULL,
    'Villa Prueba',
    'Poblacion Centro',
    'Referencia de domicilio',
    NULL,
    1,
    'INCOMPLETO',
    'EN_PROCESO'
)
ON CONFLICT (id_persona) DO NOTHING;

INSERT INTO persona_tramo_carga (
    id_persona,
    id_tramo,
    vigencia_inicio,
    observacion
)
SELECT
    p.id_persona,
    p.id_tramo_carga,
    TO_DATE(tc.periodo || '-01', 'YYYY-MM-DD'),
    'Migrado desde persona.id_tramo_carga'
FROM persona p
JOIN tramo_carga tc
    ON tc.id_tramo = p.id_tramo_carga
WHERE p.id_tramo_carga IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM persona_tramo_carga ptc
      WHERE ptc.id_persona = p.id_persona
        AND ptc.id_tramo = p.id_tramo_carga
  );

INSERT INTO ficha_validacion_resumen (
    id_ficha_validacion,
    id_persona,
    estado_ficha_calculado,
    apto_para_activacion,
    apto_para_remuneraciones,
    total_bloqueantes,
    total_criticos,
    total_advertencias,
    validado_en,
    observaciones
) VALUES (
    1,
    1,
    'INCOMPLETO',
    FALSE,
    FALSE,
    1,
    0,
    1,
    NOW(),
    'Validacion inicial de ficha demo'
)
ON CONFLICT DO NOTHING;

INSERT INTO ficha_validacion_detalle (
    id_ficha_validacion,
    dominio,
    severidad,
    codigo,
    campo,
    mensaje,
    orden,
    resuelto
) VALUES
    (1, 'PREVISION', 'BLOQUEANTE', 'AFP_REQUERIDA', 'id_afp', 'Falta confirmar AFP vigente para activacion', 1, FALSE),
    (1, 'COMPLEMENTARIOS', 'ADVERTENCIA', 'CUENTA_BANCARIA_PENDIENTE', 'id_cuenta', 'La cuenta bancaria aun no fue confirmada por el usuario', 2, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO cuenta_bancaria (
    id_cuenta,
    id_persona,
    id_banco,
    id_tipo_cuenta_bancaria,
    numero_cuenta
) VALUES (
    1,
    1,
    1,
    1,
    '1234567890'
)
ON CONFLICT (id_cuenta) DO NOTHING;

INSERT INTO contrato (
    id_contrato,
    id_persona,
    id_empresa,
    id_sucursal,
    id_departamento_empresa,
    id_tipo_trabajador,
    id_tipo_jornada,
    codigo_tipo_contrato,
    cargo,
    seguro_cesantia,
    fecha_contrato,
    fecha_inicio,
    estado
) VALUES (
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    'INDEFINIDO',
    'Analista',
    TRUE,
    '2020-01-01',
    '2020-01-01',
    'ACTIVO'
)
ON CONFLICT (id_contrato) DO NOTHING;

INSERT INTO prevision (
    id_contrato,
    tipo_prevision,
    id_afp,
    id_regimen_previsional,
    vigencia_inicio
) VALUES (
    1,
    'AFP',
    1,
    1,
    '2020-01-01'
)
ON CONFLICT (id_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO salud_trabajador (
    id_contrato,
    id_salud,
    id_salud_plan,
    usar_plan_parametrizado,
    plan_salud,
    id_moneda_plan,
    valor_plan,
    adicional_auge_ges,
    observaciones_salud,
    vigencia_inicio
) VALUES (
    1,
    1,
    1,
    TRUE,
    NULL,
    1,
    0,
    0,
    'Plan base Fonasa',
    '2020-01-01'
)
ON CONFLICT (id_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO remuneracion (
    id_contrato,
    sueldo_base,
    sueldo_variable,
    id_moneda,
    tipo_gratificacion,
    horas_semanales,
    dias_semanales,
    distribucion_jornada,
    tiempo_colacion_minutos,
    semana_corrida_activa,
    zona_extrema_activa,
    gratificacion_proporcional,
    vigencia_inicio
) VALUES (
    1,
    750000,
    FALSE,
    1,
    'LEGAL_ART_50',
    40,
    5,
    'Lunes a viernes 09:00-18:00',
    60,
    FALSE,
    FALSE,
    FALSE,
    '2020-01-01'
)
ON CONFLICT (id_contrato, vigencia_inicio) DO NOTHING;

INSERT INTO parametros_generales (
    periodo,
    uf,
    utm,
    sueldo_minimo,
    sueldo_minimo18_65,
    gratificacion,
    imm_gratificacion,
    tope_afp,
    tope_ips,
    tope_cesantia,
    tope_afpvoluntario,
    sis,
    dsctosbpordia,
    afc_trabajador_indefinido,
    afc_empleador_indefinido,
    afc_empleador_plazo
) VALUES (
    '2024-01',
    36500.0000,
    65000,
    460000,
    460000,
    TRUE,
    4.75,
    3000000,
    3000000,
    3000000,
    3000000,
    1.26,
    TRUE,
    0.6,
    2.4,
    3.0
)
ON CONFLICT (periodo) DO NOTHING;

INSERT INTO parametros_legales (nombre, valor_decimal, vigencia_inicio) VALUES
    ('UF', 36500.0000, '2024-01-01'),
    ('UTM', 65000, '2024-01-01'),
    ('SUELDO_MINIMO', 460000, '2024-01-01'),
    ('IMM_GRATIFICACION', 4.75, '2024-01-01'),
    ('TOPE_IMPONIBLE_UF', 81.60, '2024-01-01'),
    ('TOPE_IMPONIBLE_UF', 90.00, '2026-01-01'),
    ('SIS', 1.26, '2024-01-01'),
    ('LEY_SANNA', 0.03, '2026-04-01'),
    ('AFC_TRABAJADOR_INDEFINIDO', 0.60, '2024-01-01'),
    ('AFC_EMPLEADOR_INDEFINIDO', 2.40, '2024-01-01'),
    ('AFC_EMPLEADOR_PLAZO', 3.00, '2024-01-01')
ON CONFLICT (nombre, vigencia_inicio) DO NOTHING;

INSERT INTO periodo_remuneracion (
    codigo,
    anio,
    mes,
    fecha_inicio,
    fecha_fin,
    estado
)
SELECT DISTINCT
    src.codigo,
    SUBSTRING(src.codigo, 1, 4)::INT,
    SUBSTRING(src.codigo, 6, 2)::INT,
    TO_DATE(src.codigo || '-01', 'YYYY-MM-DD'),
    (DATE_TRUNC('month', TO_DATE(src.codigo || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month - 1 day')::DATE,
    'ABIERTO'
FROM (
    SELECT periodo AS codigo FROM parametros_generales
    UNION
    SELECT periodo AS codigo FROM tramo_carga
    UNION
    SELECT periodo AS codigo FROM tramo_impuesto
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM parametros_legales
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM trabajo_pesado_parametro
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM reforma_previsional_parametro
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM ley_16744_parametros
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM empresa_ley_16744
    UNION
    SELECT TO_CHAR(vigencia_inicio, 'YYYY-MM') AS codigo FROM tabla_impuesto_unico
) src
WHERE src.codigo IS NOT NULL
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tramo_impuesto (periodo, desde, hasta, factor, rebaja) VALUES
    ('2024-01', 0, 806250, 0, 0),
    ('2024-01', 806251, 1796250, 4, 32250),
    ('2024-01', 1796251, 3000000, 8, 106250)
ON CONFLICT DO NOTHING;

INSERT INTO tabla_impuesto_unico (tramo, desde, hasta, factor, rebaja, vigencia_inicio) VALUES
    (1, 0, 806250, 0.00, 0, '2024-01-01'),
    (2, 806251, 1796250, 0.04, 32250, '2024-01-01'),
    (3, 1796251, NULL, 0.08, 106250, '2024-01-01')
ON CONFLICT DO NOTHING;

INSERT INTO concepto (
    codigo, nombre, tipo, naturaleza, imponible, tributable,
    afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden_impresion
) VALUES
    ('SUELDO_BASE', 'Sueldo base', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 10),
    ('GRATIFICACION', 'Gratificacion legal', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 20),
    ('HORAS_EXTRAS', 'Horas extras', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 30),
    ('INASISTENCIA', 'Inasistencia', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 40),
    ('AFP', 'Cotizacion AFP', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 50),
    ('SALUD', 'Cotizacion salud', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 51),
    ('CESANTIA', 'Seguro cesantia', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 52),
    ('PRESTAMO', 'Descuento prestamo', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 54),
    ('IMPUESTO_RENTA', 'Impuesto a la renta', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 55),
    ('BONO_RESPONSABILIDAD', 'Bono responsabilidad', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 60),
    ('MOVILIZACION', 'Movilizacion', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 70),
    ('ZONA_EXTREMA', 'Zona extrema', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 80),
    ('AFP_EMPLEADOR', 'AFP empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 120),
    ('SIS_EMPLEADOR', 'SIS empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 121),
    ('AFC_EMPLEADOR', 'AFC empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 122)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO regla_concepto_calculo (
    id_concepto,
    codigo_regla,
    orden_calculo,
    base_calculo,
    formula_sql,
    usa_tope_imponible,
    usa_tabla_impuesto,
    calculo_automatico,
    activo,
    vigencia_inicio
)
SELECT
    c.id_concepto,
    r.codigo_regla,
    r.orden_calculo,
    r.base_calculo,
    r.formula_sql,
    r.usa_tope_imponible,
    r.usa_tabla_impuesto,
    r.calculo_automatico,
    TRUE,
    DATE '2024-01-01'
FROM concepto c
JOIN (
    VALUES
        ('SUELDO_BASE', 'BASE_REMUNERACION', 10, 'SUELDO_BASE', 'sueldo_base_proporcional', TRUE, FALSE, TRUE),
        ('GRATIFICACION', 'GRATIFICACION_LEGAL', 20, 'HABERES_IMPONIBLES', 'gratificacion_según_tipo', TRUE, FALSE, TRUE),
        ('HORAS_EXTRAS', 'HORAS_EXTRAS', 30, 'VALOR_HORA', 'cantidad * valor_hora_recargado', FALSE, FALSE, TRUE),
        ('AFP', 'DESCUENTO_AFP', 50, 'RENTA_IMPONIBLE_TOPE', '(tasa_afp + comision_afp) * base', TRUE, FALSE, TRUE),
        ('SALUD', 'DESCUENTO_SALUD', 51, 'RENTA_IMPONIBLE_TOPE', 'max(7_por_ciento, plan_salud)', TRUE, FALSE, TRUE),
        ('CESANTIA', 'DESCUENTO_AFC', 52, 'RENTA_IMPONIBLE_TOPE', 'tasa_afc_trabajador * base', TRUE, FALSE, TRUE),
        ('IMPUESTO_RENTA', 'IMPUESTO_UNICO', 55, 'TOTAL_TRIBUTABLE', 'tabla_impuesto_unico(periodo)', FALSE, TRUE, TRUE),
        ('ZONA_EXTREMA', 'ASIGNACION_ZONA_EXTREMA', 80, 'HABERES_IMPONIBLES', 'porcentaje_zona_extrema * base', FALSE, FALSE, TRUE),
        ('AFP_EMPLEADOR', 'APORTE_AFP_EMPLEADOR', 120, 'RENTA_IMPONIBLE_TOPE', 'tasa_empleador_afp * base', TRUE, FALSE, TRUE)
) AS r(codigo_concepto, codigo_regla, orden_calculo, base_calculo, formula_sql, usa_tope_imponible, usa_tabla_impuesto, calculo_automatico)
    ON r.codigo_concepto = c.codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM regla_concepto_calculo rc
    WHERE rc.id_concepto = c.id_concepto
      AND rc.codigo_regla = r.codigo_regla
      AND rc.vigencia_inicio = DATE '2024-01-01'
);


INSERT INTO haberdescuento_persona (
    id_asignacion,
    id_persona,
    id_concepto,
    monto,
    porcentaje,
    tipo,
    tipohaber,
    estado
)
SELECT
    1,
    1,
    c.id_concepto,
    50000,
    NULL,
    'FIJO',
    'IMPONIBLE',
    TRUE
FROM concepto c
WHERE c.codigo = 'BONO_RESPONSABILIDAD'
ON CONFLICT (id_asignacion) DO NOTHING;

INSERT INTO haberdescuento_persona (
    id_asignacion,
    id_persona,
    id_concepto,
    monto,
    porcentaje,
    tipo,
    tipohaber,
    estado
)
SELECT
    2,
    1,
    c.id_concepto,
    30000,
    NULL,
    'FIJO',
    'NOIMPONIBLE',
    TRUE
FROM concepto c
WHERE c.codigo = 'MOVILIZACION'
ON CONFLICT (id_asignacion) DO NOTHING;

INSERT INTO movimiento (
    id_movimiento,
    id_persona,
    id_contrato,
    fecha,
    id_concepto,
    tipomovimiento,
    motivoinasist,
    diainasist,
    hrs_pactadas,
    monto,
    cantidad,
    observacion
) VALUES
    (1, 1, 1, '2024-01-10', NULL, 2, NULL, 0, 2, 45000, 2, 'Horas extras enero'),
    (2, 1, 1, '2024-01-18', NULL, 3, 102, 1, NULL, 25000, 1, 'Inasistencia injustificada')
ON CONFLICT (id_movimiento) DO NOTHING;

INSERT INTO prestamo (
    id_prestamo,
    id_persona,
    descripcion,
    monto_total,
    valor_cuota,
    cuotas_total,
    cuotas_pagadas,
    saldo_pendiente,
    fecha_otorgamiento,
    caja,
    estado
) VALUES (
    1,
    1,
    'Prestamo interno',
    300000,
    50000,
    6,
    1,
    250000,
    '2023-12-15',
    'prestamointerno',
    'ACTIVO'
)
ON CONFLICT (id_prestamo) DO NOTHING;

INSERT INTO public.pais (
    codigo_iso2,
    codigo_iso3,
    codigo_numerico,
    nombre,
    nombre_iso,
    activo
)
VALUES
    ('AD', 'AND', '020', 'Andorra', 'Andorra', TRUE),
    ('AE', 'ARE', '784', 'Emiratos Árabes Unidos', 'United Arab Emirates', TRUE),
    ('AF', 'AFG', '004', 'Afganistán', 'Afghanistan', TRUE),
    ('AG', 'ATG', '028', 'Antigua y Barbuda', 'Antigua and Barbuda', TRUE),
    ('AI', 'AIA', '660', 'Anguila', 'Anguilla', TRUE),
    ('AL', 'ALB', '008', 'Albania', 'Albania', TRUE),
    ('AM', 'ARM', '051', 'Armenia', 'Armenia', TRUE),
    ('AO', 'AGO', '024', 'Angola', 'Angola', TRUE),
    ('AQ', 'ATA', '010', 'Antártida', 'Antarctica', TRUE),
    ('AR', 'ARG', '032', 'Argentina', 'Argentina', TRUE),
    ('AS', 'ASM', '016', 'Samoa Americana', 'American Samoa', TRUE),
    ('AT', 'AUT', '040', 'Austria', 'Austria', TRUE),
    ('AU', 'AUS', '036', 'Australia', 'Australia', TRUE),
    ('AW', 'ABW', '533', 'Aruba', 'Aruba', TRUE),
    ('AX', 'ALA', '248', 'Islas Aland', 'Åland Islands', TRUE),
    ('AZ', 'AZE', '031', 'Azerbaiyán', 'Azerbaijan', TRUE),
    ('BA', 'BIH', '070', 'Bosnia y Herzegovina', 'Bosnia and Herzegovina', TRUE),
    ('BB', 'BRB', '052', 'Barbados', 'Barbados', TRUE),
    ('BD', 'BGD', '050', 'Bangladés', 'Bangladesh', TRUE),
    ('BE', 'BEL', '056', 'Bélgica', 'Belgium', TRUE),
    ('BF', 'BFA', '854', 'Burkina Faso', 'Burkina Faso', TRUE),
    ('BG', 'BGR', '100', 'Bulgaria', 'Bulgaria', TRUE),
    ('BH', 'BHR', '048', 'Baréin', 'Bahrain', TRUE),
    ('BI', 'BDI', '108', 'Burundi', 'Burundi', TRUE),
    ('BJ', 'BEN', '204', 'Benín', 'Benin', TRUE),
    ('BL', 'BLM', '652', 'San Bartolomé', 'Saint Barthélemy', TRUE),
    ('BM', 'BMU', '060', 'Bermudas', 'Bermuda', TRUE),
    ('BN', 'BRN', '096', 'Brunéi', 'Brunei Darussalam', TRUE),
    ('BO', 'BOL', '068', 'Bolivia', 'Bolivia, Plurinational State of', TRUE),
    ('BQ', 'BES', '535', 'Caribe neerlandés', 'Bonaire, Sint Eustatius and Saba', TRUE),
    ('BR', 'BRA', '076', 'Brasil', 'Brazil', TRUE),
    ('BS', 'BHS', '044', 'Bahamas', 'Bahamas', TRUE),
    ('BT', 'BTN', '064', 'Bután', 'Bhutan', TRUE),
    ('BV', 'BVT', '074', 'Isla Bouvet', 'Bouvet Island', TRUE),
    ('BW', 'BWA', '072', 'Botsuana', 'Botswana', TRUE),
    ('BY', 'BLR', '112', 'Bielorrusia', 'Belarus', TRUE),
    ('BZ', 'BLZ', '084', 'Belice', 'Belize', TRUE),
    ('CA', 'CAN', '124', 'Canadá', 'Canada', TRUE),
    ('CC', 'CCK', '166', 'Islas Cocos', 'Cocos (Keeling) Islands', TRUE),
    ('CD', 'COD', '180', 'República Democrática del Congo', 'Congo, The Democratic Republic of the', TRUE),
    ('CF', 'CAF', '140', 'República Centroafricana', 'Central African Republic', TRUE),
    ('CG', 'COG', '178', 'Congo', 'Congo', TRUE),
    ('CH', 'CHE', '756', 'Suiza', 'Switzerland', TRUE),
    ('CI', 'CIV', '384', 'Côte d’Ivoire', 'Côte d''Ivoire', TRUE),
    ('CK', 'COK', '184', 'Islas Cook', 'Cook Islands', TRUE),
    ('CL', 'CHL', '152', 'Chile', 'Chile', TRUE),
    ('CM', 'CMR', '120', 'Camerún', 'Cameroon', TRUE),
    ('CN', 'CHN', '156', 'China', 'China', TRUE),
    ('CO', 'COL', '170', 'Colombia', 'Colombia', TRUE),
    ('CR', 'CRI', '188', 'Costa Rica', 'Costa Rica', TRUE),
    ('CU', 'CUB', '192', 'Cuba', 'Cuba', TRUE),
    ('CV', 'CPV', '132', 'Cabo Verde', 'Cabo Verde', TRUE),
    ('CW', 'CUW', '531', 'Curazao', 'Curaçao', TRUE),
    ('CX', 'CXR', '162', 'Isla de Navidad', 'Christmas Island', TRUE),
    ('CY', 'CYP', '196', 'Chipre', 'Cyprus', TRUE),
    ('CZ', 'CZE', '203', 'Chequia', 'Czechia', TRUE),
    ('DE', 'DEU', '276', 'Alemania', 'Germany', TRUE),
    ('DJ', 'DJI', '262', 'Yibuti', 'Djibouti', TRUE),
    ('DK', 'DNK', '208', 'Dinamarca', 'Denmark', TRUE),
    ('DM', 'DMA', '212', 'Dominica', 'Dominica', TRUE),
    ('DO', 'DOM', '214', 'República Dominicana', 'Dominican Republic', TRUE),
    ('DZ', 'DZA', '012', 'Argelia', 'Algeria', TRUE),
    ('EC', 'ECU', '218', 'Ecuador', 'Ecuador', TRUE),
    ('EE', 'EST', '233', 'Estonia', 'Estonia', TRUE),
    ('EG', 'EGY', '818', 'Egipto', 'Egypt', TRUE),
    ('EH', 'ESH', '732', 'Sáhara Occidental', 'Western Sahara', TRUE),
    ('ER', 'ERI', '232', 'Eritrea', 'Eritrea', TRUE),
    ('ES', 'ESP', '724', 'España', 'Spain', TRUE),
    ('ET', 'ETH', '231', 'Etiopía', 'Ethiopia', TRUE),
    ('FI', 'FIN', '246', 'Finlandia', 'Finland', TRUE),
    ('FJ', 'FJI', '242', 'Fiyi', 'Fiji', TRUE),
    ('FK', 'FLK', '238', 'Islas Malvinas', 'Falkland Islands (Malvinas)', TRUE),
    ('FM', 'FSM', '583', 'Micronesia', 'Micronesia, Federated States of', TRUE),
    ('FO', 'FRO', '234', 'Islas Feroe', 'Faroe Islands', TRUE),
    ('FR', 'FRA', '250', 'Francia', 'France', TRUE),
    ('GA', 'GAB', '266', 'Gabón', 'Gabon', TRUE),
    ('GB', 'GBR', '826', 'Reino Unido', 'United Kingdom', TRUE),
    ('GD', 'GRD', '308', 'Granada', 'Grenada', TRUE),
    ('GE', 'GEO', '268', 'Georgia', 'Georgia', TRUE),
    ('GF', 'GUF', '254', 'Guayana Francesa', 'French Guiana', TRUE),
    ('GG', 'GGY', '831', 'Guernesey', 'Guernsey', TRUE),
    ('GH', 'GHA', '288', 'Ghana', 'Ghana', TRUE),
    ('GI', 'GIB', '292', 'Gibraltar', 'Gibraltar', TRUE),
    ('GL', 'GRL', '304', 'Groenlandia', 'Greenland', TRUE),
    ('GM', 'GMB', '270', 'Gambia', 'Gambia', TRUE),
    ('GN', 'GIN', '324', 'Guinea', 'Guinea', TRUE),
    ('GP', 'GLP', '312', 'Guadalupe', 'Guadeloupe', TRUE),
    ('GQ', 'GNQ', '226', 'Guinea Ecuatorial', 'Equatorial Guinea', TRUE),
    ('GR', 'GRC', '300', 'Grecia', 'Greece', TRUE),
    ('GS', 'SGS', '239', 'Islas Georgia del Sur y Sandwich del Sur', 'South Georgia and the South Sandwich Islands', TRUE),
    ('GT', 'GTM', '320', 'Guatemala', 'Guatemala', TRUE),
    ('GU', 'GUM', '316', 'Guam', 'Guam', TRUE),
    ('GW', 'GNB', '624', 'Guinea-Bisáu', 'Guinea-Bissau', TRUE),
    ('GY', 'GUY', '328', 'Guyana', 'Guyana', TRUE),
    ('HK', 'HKG', '344', 'RAE de Hong Kong (China)', 'Hong Kong', TRUE),
    ('HM', 'HMD', '334', 'Islas Heard y McDonald', 'Heard Island and McDonald Islands', TRUE),
    ('HN', 'HND', '340', 'Honduras', 'Honduras', TRUE),
    ('HR', 'HRV', '191', 'Croacia', 'Croatia', TRUE),
    ('HT', 'HTI', '332', 'Haití', 'Haiti', TRUE),
    ('HU', 'HUN', '348', 'Hungría', 'Hungary', TRUE),
    ('ID', 'IDN', '360', 'Indonesia', 'Indonesia', TRUE),
    ('IE', 'IRL', '372', 'Irlanda', 'Ireland', TRUE),
    ('IL', 'ISR', '376', 'Israel', 'Israel', TRUE),
    ('IM', 'IMN', '833', 'Isla de Man', 'Isle of Man', TRUE),
    ('IN', 'IND', '356', 'India', 'India', TRUE),
    ('IO', 'IOT', '086', 'Territorio Británico del Océano Índico', 'British Indian Ocean Territory', TRUE),
    ('IQ', 'IRQ', '368', 'Irak', 'Iraq', TRUE),
    ('IR', 'IRN', '364', 'Irán', 'Iran, Islamic Republic of', TRUE),
    ('IS', 'ISL', '352', 'Islandia', 'Iceland', TRUE),
    ('IT', 'ITA', '380', 'Italia', 'Italy', TRUE),
    ('JE', 'JEY', '832', 'Jersey', 'Jersey', TRUE),
    ('JM', 'JAM', '388', 'Jamaica', 'Jamaica', TRUE),
    ('JO', 'JOR', '400', 'Jordania', 'Jordan', TRUE),
    ('JP', 'JPN', '392', 'Japón', 'Japan', TRUE),
    ('KE', 'KEN', '404', 'Kenia', 'Kenya', TRUE),
    ('KG', 'KGZ', '417', 'Kirguistán', 'Kyrgyzstan', TRUE),
    ('KH', 'KHM', '116', 'Camboya', 'Cambodia', TRUE),
    ('KI', 'KIR', '296', 'Kiribati', 'Kiribati', TRUE),
    ('KM', 'COM', '174', 'Comoras', 'Comoros', TRUE),
    ('KN', 'KNA', '659', 'San Cristóbal y Nieves', 'Saint Kitts and Nevis', TRUE),
    ('KP', 'PRK', '408', 'Corea del Norte', 'Korea, Democratic People''s Republic of', TRUE),
    ('KR', 'KOR', '410', 'Corea del Sur', 'Korea, Republic of', TRUE),
    ('KW', 'KWT', '414', 'Kuwait', 'Kuwait', TRUE),
    ('KY', 'CYM', '136', 'Islas Caimán', 'Cayman Islands', TRUE),
    ('KZ', 'KAZ', '398', 'Kazajistán', 'Kazakhstan', TRUE),
    ('LA', 'LAO', '418', 'Laos', 'Lao People''s Democratic Republic', TRUE),
    ('LB', 'LBN', '422', 'Líbano', 'Lebanon', TRUE),
    ('LC', 'LCA', '662', 'Santa Lucía', 'Saint Lucia', TRUE),
    ('LI', 'LIE', '438', 'Liechtenstein', 'Liechtenstein', TRUE),
    ('LK', 'LKA', '144', 'Sri Lanka', 'Sri Lanka', TRUE),
    ('LR', 'LBR', '430', 'Liberia', 'Liberia', TRUE),
    ('LS', 'LSO', '426', 'Lesoto', 'Lesotho', TRUE),
    ('LT', 'LTU', '440', 'Lituania', 'Lithuania', TRUE),
    ('LU', 'LUX', '442', 'Luxemburgo', 'Luxembourg', TRUE),
    ('LV', 'LVA', '428', 'Letonia', 'Latvia', TRUE),
    ('LY', 'LBY', '434', 'Libia', 'Libya', TRUE),
    ('MA', 'MAR', '504', 'Marruecos', 'Morocco', TRUE),
    ('MC', 'MCO', '492', 'Mónaco', 'Monaco', TRUE),
    ('MD', 'MDA', '498', 'Moldavia', 'Moldova, Republic of', TRUE),
    ('ME', 'MNE', '499', 'Montenegro', 'Montenegro', TRUE),
    ('MF', 'MAF', '663', 'San Martín', 'Saint Martin (French part)', TRUE),
    ('MG', 'MDG', '450', 'Madagascar', 'Madagascar', TRUE),
    ('MH', 'MHL', '584', 'Islas Marshall', 'Marshall Islands', TRUE),
    ('MK', 'MKD', '807', 'Macedonia del Norte', 'North Macedonia', TRUE),
    ('ML', 'MLI', '466', 'Mali', 'Mali', TRUE),
    ('MM', 'MMR', '104', 'Myanmar (Birmania)', 'Myanmar', TRUE),
    ('MN', 'MNG', '496', 'Mongolia', 'Mongolia', TRUE),
    ('MO', 'MAC', '446', 'RAE de Macao (China)', 'Macao', TRUE),
    ('MP', 'MNP', '580', 'Islas Marianas del Norte', 'Northern Mariana Islands', TRUE),
    ('MQ', 'MTQ', '474', 'Martinica', 'Martinique', TRUE),
    ('MR', 'MRT', '478', 'Mauritania', 'Mauritania', TRUE),
    ('MS', 'MSR', '500', 'Montserrat', 'Montserrat', TRUE),
    ('MT', 'MLT', '470', 'Malta', 'Malta', TRUE),
    ('MU', 'MUS', '480', 'Mauricio', 'Mauritius', TRUE),
    ('MV', 'MDV', '462', 'Maldivas', 'Maldives', TRUE),
    ('MW', 'MWI', '454', 'Malaui', 'Malawi', TRUE),
    ('MX', 'MEX', '484', 'México', 'Mexico', TRUE),
    ('MY', 'MYS', '458', 'Malasia', 'Malaysia', TRUE),
    ('MZ', 'MOZ', '508', 'Mozambique', 'Mozambique', TRUE),
    ('NA', 'NAM', '516', 'Namibia', 'Namibia', TRUE),
    ('NC', 'NCL', '540', 'Nueva Caledonia', 'New Caledonia', TRUE),
    ('NE', 'NER', '562', 'Níger', 'Niger', TRUE),
    ('NF', 'NFK', '574', 'Isla Norfolk', 'Norfolk Island', TRUE),
    ('NG', 'NGA', '566', 'Nigeria', 'Nigeria', TRUE),
    ('NI', 'NIC', '558', 'Nicaragua', 'Nicaragua', TRUE),
    ('NL', 'NLD', '528', 'Países Bajos', 'Netherlands', TRUE),
    ('NO', 'NOR', '578', 'Noruega', 'Norway', TRUE),
    ('NP', 'NPL', '524', 'Nepal', 'Nepal', TRUE),
    ('NR', 'NRU', '520', 'Nauru', 'Nauru', TRUE),
    ('NU', 'NIU', '570', 'Niue', 'Niue', TRUE),
    ('NZ', 'NZL', '554', 'Nueva Zelanda', 'New Zealand', TRUE),
    ('OM', 'OMN', '512', 'Omán', 'Oman', TRUE),
    ('PA', 'PAN', '591', 'Panamá', 'Panama', TRUE),
    ('PE', 'PER', '604', 'Perú', 'Peru', TRUE),
    ('PF', 'PYF', '258', 'Polinesia Francesa', 'French Polynesia', TRUE),
    ('PG', 'PNG', '598', 'Papúa Nueva Guinea', 'Papua New Guinea', TRUE),
    ('PH', 'PHL', '608', 'Filipinas', 'Philippines', TRUE),
    ('PK', 'PAK', '586', 'Pakistán', 'Pakistan', TRUE),
    ('PL', 'POL', '616', 'Polonia', 'Poland', TRUE),
    ('PM', 'SPM', '666', 'San Pedro y Miquelón', 'Saint Pierre and Miquelon', TRUE),
    ('PN', 'PCN', '612', 'Islas Pitcairn', 'Pitcairn', TRUE),
    ('PR', 'PRI', '630', 'Puerto Rico', 'Puerto Rico', TRUE),
    ('PS', 'PSE', '275', 'Territorios Palestinos', 'Palestine, State of', TRUE),
    ('PT', 'PRT', '620', 'Portugal', 'Portugal', TRUE),
    ('PW', 'PLW', '585', 'Palaos', 'Palau', TRUE),
    ('PY', 'PRY', '600', 'Paraguay', 'Paraguay', TRUE),
    ('QA', 'QAT', '634', 'Catar', 'Qatar', TRUE),
    ('RE', 'REU', '638', 'Reunión', 'Réunion', TRUE),
    ('RO', 'ROU', '642', 'Rumanía', 'Romania', TRUE),
    ('RS', 'SRB', '688', 'Serbia', 'Serbia', TRUE),
    ('RU', 'RUS', '643', 'Rusia', 'Russian Federation', TRUE),
    ('RW', 'RWA', '646', 'Ruanda', 'Rwanda', TRUE),
    ('SA', 'SAU', '682', 'Arabia Saudí', 'Saudi Arabia', TRUE),
    ('SB', 'SLB', '090', 'Islas Salomón', 'Solomon Islands', TRUE),
    ('SC', 'SYC', '690', 'Seychelles', 'Seychelles', TRUE),
    ('SD', 'SDN', '729', 'Sudán', 'Sudan', TRUE),
    ('SE', 'SWE', '752', 'Suecia', 'Sweden', TRUE),
    ('SG', 'SGP', '702', 'Singapur', 'Singapore', TRUE),
    ('SH', 'SHN', '654', 'Santa Elena', 'Saint Helena, Ascension and Tristan da Cunha', TRUE),
    ('SI', 'SVN', '705', 'Eslovenia', 'Slovenia', TRUE),
    ('SJ', 'SJM', '744', 'Svalbard y Jan Mayen', 'Svalbard and Jan Mayen', TRUE),
    ('SK', 'SVK', '703', 'Eslovaquia', 'Slovakia', TRUE),
    ('SL', 'SLE', '694', 'Sierra Leona', 'Sierra Leone', TRUE),
    ('SM', 'SMR', '674', 'San Marino', 'San Marino', TRUE),
    ('SN', 'SEN', '686', 'Senegal', 'Senegal', TRUE),
    ('SO', 'SOM', '706', 'Somalia', 'Somalia', TRUE),
    ('SR', 'SUR', '740', 'Surinam', 'Suriname', TRUE),
    ('SS', 'SSD', '728', 'Sudán del Sur', 'South Sudan', TRUE),
    ('ST', 'STP', '678', 'Santo Tomé y Príncipe', 'Sao Tome and Principe', TRUE),
    ('SV', 'SLV', '222', 'El Salvador', 'El Salvador', TRUE),
    ('SX', 'SXM', '534', 'Sint Maarten', 'Sint Maarten (Dutch part)', TRUE),
    ('SY', 'SYR', '760', 'Siria', 'Syrian Arab Republic', TRUE),
    ('SZ', 'SWZ', '748', 'Esuatini', 'Eswatini', TRUE),
    ('TC', 'TCA', '796', 'Islas Turcas y Caicos', 'Turks and Caicos Islands', TRUE),
    ('TD', 'TCD', '148', 'Chad', 'Chad', TRUE),
    ('TF', 'ATF', '260', 'Territorios Australes Franceses', 'French Southern Territories', TRUE),
    ('TG', 'TGO', '768', 'Togo', 'Togo', TRUE),
    ('TH', 'THA', '764', 'Tailandia', 'Thailand', TRUE),
    ('TJ', 'TJK', '762', 'Tayikistán', 'Tajikistan', TRUE),
    ('TK', 'TKL', '772', 'Tokelau', 'Tokelau', TRUE),
    ('TL', 'TLS', '626', 'Timor-Leste', 'Timor-Leste', TRUE),
    ('TM', 'TKM', '795', 'Turkmenistán', 'Turkmenistan', TRUE),
    ('TN', 'TUN', '788', 'Túnez', 'Tunisia', TRUE),
    ('TO', 'TON', '776', 'Tonga', 'Tonga', TRUE),
    ('TR', 'TUR', '792', 'Turquía', 'Türkiye', TRUE),
    ('TT', 'TTO', '780', 'Trinidad y Tobago', 'Trinidad and Tobago', TRUE),
    ('TV', 'TUV', '798', 'Tuvalu', 'Tuvalu', TRUE),
    ('TW', 'TWN', '158', 'Taiwán', 'Taiwan, Province of China', TRUE),
    ('TZ', 'TZA', '834', 'Tanzania', 'Tanzania, United Republic of', TRUE),
    ('UA', 'UKR', '804', 'Ucrania', 'Ukraine', TRUE),
    ('UG', 'UGA', '800', 'Uganda', 'Uganda', TRUE),
    ('UM', 'UMI', '581', 'Islas menores alejadas de EE. UU.', 'United States Minor Outlying Islands', TRUE),
    ('US', 'USA', '840', 'Estados Unidos', 'United States', TRUE),
    ('UY', 'URY', '858', 'Uruguay', 'Uruguay', TRUE),
    ('UZ', 'UZB', '860', 'Uzbekistán', 'Uzbekistan', TRUE),
    ('VA', 'VAT', '336', 'Ciudad del Vaticano', 'Holy See (Vatican City State)', TRUE),
    ('VC', 'VCT', '670', 'San Vicente y las Granadinas', 'Saint Vincent and the Grenadines', TRUE),
    ('VE', 'VEN', '862', 'Venezuela', 'Venezuela, Bolivarian Republic of', TRUE),
    ('VG', 'VGB', '092', 'Islas Vírgenes Británicas', 'Virgin Islands, British', TRUE),
    ('VI', 'VIR', '850', 'Islas Vírgenes de EE. UU.', 'Virgin Islands, U.S.', TRUE),
    ('VN', 'VNM', '704', 'Vietnam', 'Viet Nam', TRUE),
    ('VU', 'VUT', '548', 'Vanuatu', 'Vanuatu', TRUE),
    ('WF', 'WLF', '876', 'Wallis y Futuna', 'Wallis and Futuna', TRUE),
    ('WS', 'WSM', '882', 'Samoa', 'Samoa', TRUE),
    ('YE', 'YEM', '887', 'Yemen', 'Yemen', TRUE),
    ('YT', 'MYT', '175', 'Mayotte', 'Mayotte', TRUE),
    ('ZA', 'ZAF', '710', 'Sudáfrica', 'South Africa', TRUE),
    ('ZM', 'ZMB', '894', 'Zambia', 'Zambia', TRUE),
    ('ZW', 'ZWE', '716', 'Zimbabue', 'Zimbabwe', TRUE)
ON CONFLICT (codigo_iso2)
DO UPDATE SET
    codigo_iso3         = EXCLUDED.codigo_iso3,
    codigo_numerico     = EXCLUDED.codigo_numerico,
    nombre              = EXCLUDED.nombre,
    nombre_iso          = EXCLUDED.nombre_iso,
    activo              = EXCLUDED.activo,
    fecha_actualizacion = NOW();
