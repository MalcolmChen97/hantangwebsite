-- =============================================================================
-- TCM Clinic PWA - Seed Data
-- =============================================================================

-- =============================================================================
-- Common Acupoints (36 important points)
-- =============================================================================
INSERT INTO common_acupoints (code, name_pinyin, name_chinese, name_english, meridian, common_uses, is_favorite, sort_order) VALUES
-- Lung Meridian (LU)
('LU5',  'Chi Ze',      '尺泽', 'Cubit Marsh',         'Lung',            'Cough, asthma, elbow pain, enuresis', true, 1),
('LU7',  'Lie Que',     '列缺', 'Broken Sequence',     'Lung',            'Headache, neck stiffness, cough, asthma, sore throat', true, 2),
('LU9',  'Tai Yuan',    '太渊', 'Supreme Abyss',       'Lung',            'Cough, asthma, chest pain, wrist pain', false, 3),

-- Large Intestine Meridian (LI)
('LI4',  'He Gu',       '合谷', 'Joining Valley',      'Large Intestine', 'Headache, toothache, facial pain, sore throat, fever, pain relief', true, 4),
('LI11', 'Qu Chi',      '曲池', 'Pool at the Crook',   'Large Intestine', 'Fever, hypertension, elbow pain, skin diseases, immune support', true, 5),
('LI20', 'Ying Xiang',  '迎香', 'Welcome Fragrance',   'Large Intestine', 'Nasal congestion, sinusitis, loss of smell, facial paralysis', false, 6),

-- Stomach Meridian (ST)
('ST25', 'Tian Shu',    '天枢', 'Celestial Pivot',     'Stomach',         'Abdominal pain, diarrhea, constipation, irregular menstruation', true, 7),
('ST36', 'Zu San Li',   '足三里', 'Leg Three Miles',   'Stomach',         'Digestive issues, fatigue, immune boost, knee pain, general tonification', true, 8),
('ST40', 'Feng Long',   '丰隆', 'Abundant Bulge',      'Stomach',         'Phlegm, cough, dizziness, headache, mania', true, 9),
('ST44', 'Nei Ting',    '内庭', 'Inner Court',         'Stomach',         'Toothache, sore throat, gastric pain, diarrhea', false, 10),

-- Spleen Meridian (SP)
('SP6',  'San Yin Jiao','三阴交', 'Three Yin Intersection', 'Spleen',     'Digestive issues, gynecological disorders, insomnia, urinary problems', true, 11),
('SP9',  'Yin Ling Quan','阴陵泉', 'Yin Mound Spring',     'Spleen',     'Edema, abdominal distension, diarrhea, knee pain, urinary issues', true, 12),
('SP10', 'Xue Hai',     '血海', 'Sea of Blood',        'Spleen',          'Irregular menstruation, skin diseases, knee pain, blood stasis', false, 13),

-- Heart Meridian (HT)
('HT7',  'Shen Men',    '神门', 'Spirit Gate',         'Heart',           'Insomnia, anxiety, palpitations, poor memory, cardiac pain', true, 14),

-- Small Intestine Meridian (SI)
('SI3',  'Hou Xi',      '后溪', 'Back Ravine',         'Small Intestine', 'Neck rigidity, back pain, headache, malaria, night sweating', false, 15),

-- Bladder Meridian (BL)
('BL13', 'Fei Shu',     '肺俞', 'Lung Shu',           'Bladder',         'Cough, asthma, chest fullness, night sweating, back pain', true, 16),
('BL17', 'Ge Shu',      '膈俞', 'Diaphragm Shu',      'Bladder',         'Hiccup, vomiting, blood disorders, night sweating, back pain', false, 17),
('BL18', 'Gan Shu',     '肝俞', 'Liver Shu',          'Bladder',         'Liver disorders, eye diseases, emotional issues, back pain', true, 18),
('BL20', 'Pi Shu',      '脾俞', 'Spleen Shu',         'Bladder',         'Abdominal distension, diarrhea, edema, poor appetite, back pain', true, 19),
('BL23', 'Shen Shu',    '肾俞', 'Kidney Shu',         'Bladder',         'Low back pain, tinnitus, impotence, irregular menstruation, edema', true, 20),
('BL40', 'Wei Zhong',   '委中', 'Bend Middle',         'Bladder',         'Low back pain, sciatica, knee pain, skin diseases', true, 21),
('BL60', 'Kun Lun',     '昆仑', 'Kunlun Mountains',    'Bladder',         'Headache, neck rigidity, back pain, heel pain, difficult labor', false, 22),

-- Kidney Meridian (KI)
('KI3',  'Tai Xi',      '太溪', 'Supreme Stream',      'Kidney',          'Low back pain, tinnitus, insomnia, sore throat, toothache', true, 23),
('KI6',  'Zhao Hai',    '照海', 'Shining Sea',         'Kidney',          'Insomnia, sore throat, epilepsy, irregular menstruation', false, 24),

-- Pericardium Meridian (PC)
('PC6',  'Nei Guan',    '内关', 'Inner Pass',          'Pericardium',     'Nausea, vomiting, cardiac pain, palpitations, anxiety, chest pain', true, 25),

-- Triple Energizer Meridian (TE)
('TE5',  'Wai Guan',    '外关', 'Outer Pass',          'Triple Energizer', 'Fever, headache, ear disorders, rib pain, arm pain', false, 26),

-- Gallbladder Meridian (GB)
('GB20', 'Feng Chi',    '风池', 'Wind Pool',           'Gallbladder',     'Headache, dizziness, neck stiffness, eye diseases, common cold', true, 27),
('GB21', 'Jian Jing',   '肩井', 'Shoulder Well',       'Gallbladder',     'Neck and shoulder pain, headache, difficult labor', false, 28),
('GB34', 'Yang Ling Quan','阳陵泉', 'Yang Mound Spring', 'Gallbladder',   'Knee pain, leg pain, liver and gallbladder disorders, rib pain', true, 29),

-- Liver Meridian (LR)
('LR3',  'Tai Chong',   '太冲', 'Supreme Surge',       'Liver',           'Headache, dizziness, hypertension, emotional disorders, eye diseases', true, 30),
('LR14', 'Qi Men',      '期门', 'Cycle Gate',          'Liver',           'Chest and rib pain, liver disorders, hiccup, acid reflux', false, 31),

-- Governing Vessel (DU/GV)
('GV4',  'Ming Men',    '命门', 'Life Gate',           'Governing Vessel', 'Low back pain, impotence, diarrhea, leukorrhea', false, 32),
('GV14', 'Da Zhui',     '大椎', 'Great Vertebra',      'Governing Vessel', 'Fever, malaria, neck rigidity, cough, asthma, epilepsy', true, 33),
('GV20', 'Bai Hui',     '百会', 'Hundred Meetings',    'Governing Vessel', 'Headache, dizziness, prolapse, insomnia, poor memory, yang deficiency', true, 34),

-- Conception Vessel (RN/CV)
('CV4',  'Guan Yuan',   '关元', 'Origin Pass',         'Conception Vessel', 'Urinary issues, impotence, diarrhea, menstrual disorders, qi deficiency', true, 35),
('CV6',  'Qi Hai',      '气海', 'Sea of Qi',           'Conception Vessel', 'Abdominal pain, enuresis, hernia, edema, qi deficiency', true, 36);


-- =============================================================================
-- Common TCM Formulas (18 classic formulas)
-- =============================================================================
INSERT INTO common_formulas (name_pinyin, name_chinese, name_english, category, default_herbs, instructions, is_favorite, sort_order) VALUES

('Si Jun Zi Tang', '四君子汤', 'Four Gentlemen Decoction', 'Qi Tonifying',
 '[{"herb_name_pinyin":"Ren Shen","herb_name_chinese":"人参","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Bai Zhu","herb_name_chinese":"白术","dosage_grams":9,"processing_method":"chao"},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":6,"processing_method":"zhi"}]',
 'Decoct with water. Take warm, twice daily.', true, 1),

('Si Wu Tang', '四物汤', 'Four Substances Decoction', 'Blood Tonifying',
 '[{"herb_name_pinyin":"Shu Di Huang","herb_name_chinese":"熟地黄","dosage_grams":12,"processing_method":"shu"},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":10,"processing_method":null},{"herb_name_pinyin":"Bai Shao","herb_name_chinese":"白芍","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Chuan Xiong","herb_name_chinese":"川芎","dosage_grams":8,"processing_method":null}]',
 'Decoct with water. Take warm, twice daily.', true, 2),

('Liu Wei Di Huang Wan', '六味地黄丸', 'Six Ingredient Rehmannia Pill', 'Yin Tonifying',
 '[{"herb_name_pinyin":"Shu Di Huang","herb_name_chinese":"熟地黄","dosage_grams":24,"processing_method":"shu"},{"herb_name_pinyin":"Shan Zhu Yu","herb_name_chinese":"山茱萸","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Shan Yao","herb_name_chinese":"山药","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Ze Xie","herb_name_chinese":"泽泻","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Mu Dan Pi","herb_name_chinese":"牡丹皮","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":9,"processing_method":null}]',
 'Traditionally prepared as pills. May also be decocted. Take twice daily.', true, 3),

('Bu Zhong Yi Qi Tang', '补中益气汤', 'Tonify the Middle and Augment Qi Decoction', 'Qi Tonifying',
 '[{"herb_name_pinyin":"Huang Qi","herb_name_chinese":"黄芪","dosage_grams":15,"processing_method":"sheng"},{"herb_name_pinyin":"Ren Shen","herb_name_chinese":"人参","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Bai Zhu","herb_name_chinese":"白术","dosage_grams":9,"processing_method":"chao"},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Chen Pi","herb_name_chinese":"陈皮","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Sheng Ma","herb_name_chinese":"升麻","dosage_grams":3,"processing_method":null},{"herb_name_pinyin":"Chai Hu","herb_name_chinese":"柴胡","dosage_grams":3,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":6,"processing_method":"zhi"}]',
 'Decoct with water. Take warm, twice daily before meals.', true, 4),

('Xiao Chai Hu Tang', '小柴胡汤', 'Minor Bupleurum Decoction', 'Harmonizing',
 '[{"herb_name_pinyin":"Chai Hu","herb_name_chinese":"柴胡","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Huang Qin","herb_name_chinese":"黄芩","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Ban Xia","herb_name_chinese":"半夏","dosage_grams":9,"processing_method":"fa"},{"herb_name_pinyin":"Ren Shen","herb_name_chinese":"人参","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Sheng Jiang","herb_name_chinese":"生姜","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Da Zao","herb_name_chinese":"大枣","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":6,"processing_method":"zhi"}]',
 'Decoct with water. Take warm, twice daily.', true, 5),

('Gui Pi Tang', '归脾汤', 'Restore the Spleen Decoction', 'Qi and Blood Tonifying',
 '[{"herb_name_pinyin":"Ren Shen","herb_name_chinese":"人参","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Huang Qi","herb_name_chinese":"黄芪","dosage_grams":12,"processing_method":"sheng"},{"herb_name_pinyin":"Bai Zhu","herb_name_chinese":"白术","dosage_grams":9,"processing_method":"chao"},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Long Yan Rou","herb_name_chinese":"龙眼肉","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Suan Zao Ren","herb_name_chinese":"酸枣仁","dosage_grams":12,"processing_method":"chao"},{"herb_name_pinyin":"Yuan Zhi","herb_name_chinese":"远志","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Mu Xiang","herb_name_chinese":"木香","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":6,"processing_method":"zhi"},{"herb_name_pinyin":"Sheng Jiang","herb_name_chinese":"生姜","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Da Zao","herb_name_chinese":"大枣","dosage_grams":9,"processing_method":null}]',
 'Decoct with water. Take warm, twice daily.', true, 6),

('Xiao Yao San', '逍遥散', 'Free and Easy Wanderer Powder', 'Liver Qi Regulating',
 '[{"herb_name_pinyin":"Chai Hu","herb_name_chinese":"柴胡","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Bai Shao","herb_name_chinese":"白芍","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Bai Zhu","herb_name_chinese":"白术","dosage_grams":9,"processing_method":"chao"},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":6,"processing_method":"zhi"},{"herb_name_pinyin":"Bo He","herb_name_chinese":"薄荷","dosage_grams":3,"processing_method":null},{"herb_name_pinyin":"Sheng Jiang","herb_name_chinese":"生姜","dosage_grams":6,"processing_method":null}]',
 'Decoct with water. Take warm, twice daily. Add Bo He in last 5 minutes of decoction.', true, 7),

('Gui Zhi Tang', '桂枝汤', 'Cinnamon Twig Decoction', 'Exterior Releasing',
 '[{"herb_name_pinyin":"Gui Zhi","herb_name_chinese":"桂枝","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Bai Shao","herb_name_chinese":"白芍","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Sheng Jiang","herb_name_chinese":"生姜","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Da Zao","herb_name_chinese":"大枣","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":6,"processing_method":"zhi"}]',
 'Decoct with water. Take warm, then eat hot porridge and cover with blanket to promote mild sweating.', false, 8),

('Ma Huang Tang', '麻黄汤', 'Ephedra Decoction', 'Exterior Releasing',
 '[{"herb_name_pinyin":"Ma Huang","herb_name_chinese":"麻黄","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Gui Zhi","herb_name_chinese":"桂枝","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Xing Ren","herb_name_chinese":"杏仁","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":3,"processing_method":"zhi"}]',
 'Decoct Ma Huang first for a few minutes, skim foam, then add remaining herbs. Take warm.', false, 9),

('Yin Qiao San', '银翘散', 'Honeysuckle and Forsythia Powder', 'Wind-Heat Releasing',
 '[{"herb_name_pinyin":"Jin Yin Hua","herb_name_chinese":"金银花","dosage_grams":15,"processing_method":null},{"herb_name_pinyin":"Lian Qiao","herb_name_chinese":"连翘","dosage_grams":15,"processing_method":null},{"herb_name_pinyin":"Jie Geng","herb_name_chinese":"桔梗","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Bo He","herb_name_chinese":"薄荷","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Dan Zhu Ye","herb_name_chinese":"淡竹叶","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Niu Bang Zi","herb_name_chinese":"牛蒡子","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Jing Jie","herb_name_chinese":"荆芥","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Dan Dou Chi","herb_name_chinese":"淡豆豉","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Gan Cao","herb_name_chinese":"甘草","dosage_grams":3,"processing_method":null}]',
 'Do not over-decoct. Take warm, 2-3 times daily.', true, 10),

('Er Chen Tang', '二陈汤', 'Two Cured Decoction', 'Phlegm Resolving',
 '[{"herb_name_pinyin":"Ban Xia","herb_name_chinese":"半夏","dosage_grams":12,"processing_method":"fa"},{"herb_name_pinyin":"Chen Pi","herb_name_chinese":"陈皮","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":3,"processing_method":"zhi"},{"herb_name_pinyin":"Sheng Jiang","herb_name_chinese":"生姜","dosage_grams":6,"processing_method":null}]',
 'Decoct with water. Take warm, twice daily.', false, 11),

('Tian Wang Bu Xin Dan', '天王补心丹', 'Emperor of Heaven Special Pill to Tonify the Heart', 'Heart and Yin Tonifying',
 '[{"herb_name_pinyin":"Sheng Di Huang","herb_name_chinese":"生地黄","dosage_grams":15,"processing_method":"sheng"},{"herb_name_pinyin":"Ren Shen","herb_name_chinese":"人参","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Dan Shen","herb_name_chinese":"丹参","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Xuan Shen","herb_name_chinese":"玄参","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Yuan Zhi","herb_name_chinese":"远志","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Wu Wei Zi","herb_name_chinese":"五味子","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Mai Men Dong","herb_name_chinese":"麦门冬","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Tian Men Dong","herb_name_chinese":"天门冬","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Bai Zi Ren","herb_name_chinese":"柏子仁","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Suan Zao Ren","herb_name_chinese":"酸枣仁","dosage_grams":9,"processing_method":"chao"},{"herb_name_pinyin":"Jie Geng","herb_name_chinese":"桔梗","dosage_grams":6,"processing_method":null}]',
 'Traditionally prepared as honey pills. May be decocted. Take twice daily before bed.', false, 12),

('Ban Xia Xie Xin Tang', '半夏泻心汤', 'Pinellia Decoction to Drain the Epigastrium', 'Harmonizing',
 '[{"herb_name_pinyin":"Ban Xia","herb_name_chinese":"半夏","dosage_grams":12,"processing_method":"fa"},{"herb_name_pinyin":"Huang Qin","herb_name_chinese":"黄芩","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Huang Lian","herb_name_chinese":"黄连","dosage_grams":3,"processing_method":null},{"herb_name_pinyin":"Gan Jiang","herb_name_chinese":"干姜","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Ren Shen","herb_name_chinese":"人参","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Da Zao","herb_name_chinese":"大枣","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Zhi Gan Cao","herb_name_chinese":"炙甘草","dosage_grams":6,"processing_method":"zhi"}]',
 'Decoct with water. Take warm, twice daily.', false, 13),

('Suan Zao Ren Tang', '酸枣仁汤', 'Sour Jujube Decoction', 'Heart Calming',
 '[{"herb_name_pinyin":"Suan Zao Ren","herb_name_chinese":"酸枣仁","dosage_grams":18,"processing_method":"chao"},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Zhi Mu","herb_name_chinese":"知母","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Chuan Xiong","herb_name_chinese":"川芎","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Gan Cao","herb_name_chinese":"甘草","dosage_grams":3,"processing_method":null}]',
 'Decoct with water. Take warm before bedtime.', true, 14),

('Du Huo Ji Sheng Tang', '独活寄生汤', 'Angelica Pubescens and Sangjisheng Decoction', 'Wind-Damp Dispelling',
 '[{"herb_name_pinyin":"Du Huo","herb_name_chinese":"独活","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Sang Ji Sheng","herb_name_chinese":"桑寄生","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Du Zhong","herb_name_chinese":"杜仲","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Niu Xi","herb_name_chinese":"牛膝","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Xi Xin","herb_name_chinese":"细辛","dosage_grams":3,"processing_method":null},{"herb_name_pinyin":"Qin Jiao","herb_name_chinese":"秦艽","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Rou Gui","herb_name_chinese":"肉桂","dosage_grams":3,"processing_method":null},{"herb_name_pinyin":"Fang Feng","herb_name_chinese":"防风","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Chuan Xiong","herb_name_chinese":"川芎","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Ren Shen","herb_name_chinese":"人参","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Bai Shao","herb_name_chinese":"白芍","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Shu Di Huang","herb_name_chinese":"熟地黄","dosage_grams":12,"processing_method":"shu"},{"herb_name_pinyin":"Gan Cao","herb_name_chinese":"甘草","dosage_grams":6,"processing_method":null}]',
 'Decoct with water. Take warm, twice daily.', false, 15),

('Long Dan Xie Gan Tang', '龙胆泻肝汤', 'Gentiana Longdancao Decoction to Drain the Liver', 'Liver Fire Clearing',
 '[{"herb_name_pinyin":"Long Dan Cao","herb_name_chinese":"龙胆草","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Huang Qin","herb_name_chinese":"黄芩","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Zhi Zi","herb_name_chinese":"栀子","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Ze Xie","herb_name_chinese":"泽泻","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Mu Tong","herb_name_chinese":"木通","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Che Qian Zi","herb_name_chinese":"车前子","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Chai Hu","herb_name_chinese":"柴胡","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Sheng Di Huang","herb_name_chinese":"生地黄","dosage_grams":12,"processing_method":"sheng"},{"herb_name_pinyin":"Gan Cao","herb_name_chinese":"甘草","dosage_grams":6,"processing_method":null}]',
 'Decoct with water. Take warm, twice daily. Not for long-term use.', false, 16),

('Bao He Wan', '保和丸', 'Preserve Harmony Pill', 'Food Stagnation Resolving',
 '[{"herb_name_pinyin":"Shan Zha","herb_name_chinese":"山楂","dosage_grams":15,"processing_method":null},{"herb_name_pinyin":"Shen Qu","herb_name_chinese":"神曲","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Lai Fu Zi","herb_name_chinese":"莱菔子","dosage_grams":9,"processing_method":"chao"},{"herb_name_pinyin":"Ban Xia","herb_name_chinese":"半夏","dosage_grams":9,"processing_method":"fa"},{"herb_name_pinyin":"Chen Pi","herb_name_chinese":"陈皮","dosage_grams":6,"processing_method":null},{"herb_name_pinyin":"Fu Ling","herb_name_chinese":"茯苓","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Lian Qiao","herb_name_chinese":"连翘","dosage_grams":6,"processing_method":null}]',
 'Decoct with water or take as pills. Take after meals.', true, 17),

('Tao Hong Si Wu Tang', '桃红四物汤', 'Four Substances Decoction with Safflower and Peach Pit', 'Blood Activating',
 '[{"herb_name_pinyin":"Shu Di Huang","herb_name_chinese":"熟地黄","dosage_grams":12,"processing_method":"shu"},{"herb_name_pinyin":"Dang Gui","herb_name_chinese":"当归","dosage_grams":10,"processing_method":null},{"herb_name_pinyin":"Bai Shao","herb_name_chinese":"白芍","dosage_grams":12,"processing_method":null},{"herb_name_pinyin":"Chuan Xiong","herb_name_chinese":"川芎","dosage_grams":8,"processing_method":null},{"herb_name_pinyin":"Tao Ren","herb_name_chinese":"桃仁","dosage_grams":9,"processing_method":null},{"herb_name_pinyin":"Hong Hua","herb_name_chinese":"红花","dosage_grams":6,"processing_method":null}]',
 'Decoct with water. Take warm, twice daily. Contraindicated during pregnancy.', false, 18);


-- =============================================================================
-- Common Templates
-- =============================================================================
INSERT INTO common_templates (category, title, content, sort_order, is_active) VALUES

-- Chief Complaint templates
('chief_complaint', 'Low Back Pain', 'Patient presents with low back pain, duration: ___. Pain character: dull/sharp/radiating. Aggravated by: ___. Relieved by: ___.', 1, true),
('chief_complaint', 'Headache', 'Patient presents with headache, location: frontal/temporal/occipital/vertex. Duration: ___. Frequency: ___. Associated symptoms: nausea/visual changes/neck stiffness.', 2, true),
('chief_complaint', 'Insomnia', 'Patient reports difficulty falling asleep / staying asleep / early waking. Duration: ___. Current sleep pattern: ___. Associated symptoms: anxiety/palpitations/dream-disturbed sleep.', 3, true),
('chief_complaint', 'Digestive Issues', 'Patient presents with digestive complaints: bloating/gas/nausea/acid reflux/loose stools/constipation. Duration: ___. Relation to meals: ___. Appetite: normal/reduced/increased.', 4, true),
('chief_complaint', 'Neck and Shoulder Pain', 'Patient presents with neck and shoulder pain/stiffness. Duration: ___. Range of motion: limited/normal. Aggravating factors: desk work/stress/cold. Radiating: yes/no.', 5, true),
('chief_complaint', 'Anxiety and Stress', 'Patient reports anxiety/stress symptoms. Duration: ___. Triggers: ___. Associated symptoms: palpitations/chest tightness/irritability/poor concentration.', 6, true),
('chief_complaint', 'Menstrual Irregularity', 'Patient reports menstrual irregularity. Cycle length: ___. Duration of menses: ___. Flow: heavy/normal/scanty. Pain: yes/no. Clots: yes/no. Last period: ___.', 7, true),
('chief_complaint', 'Allergies/Sinusitis', 'Patient presents with nasal congestion/rhinorrhea/sneezing/itchy eyes. Duration: ___. Seasonal: yes/no. Known allergens: ___. Current medications: ___.', 8, true),

-- Doctor Notes templates
('doctor_notes', 'Initial Assessment', 'Tongue: body color ___, coating ___, shape ___.\nPulse: rate ___, quality ___ (L: ___, R: ___).\nTCM Pattern: ___.\nTreatment Principle: ___.\nPlan: ___.', 1, true),
('doctor_notes', 'Follow-Up Note', 'Since last visit: symptoms improved/unchanged/worsened.\nCurrent presentation: ___.\nTongue: ___. Pulse: ___.\nTCM Pattern: ___.\nAdjustments to treatment: ___.', 2, true),
('doctor_notes', 'Acupuncture Treatment Note', 'Points selected: ___.\nTechnique: even/tonifying/reducing.\nNeedle retention: ___ minutes.\nPatient response: ___ (de qi obtained: yes/no).\nAdditional modalities: moxa/cupping/e-stim/gua sha.', 3, true),

-- Treatment Plan templates
('treatment_plan', 'Standard Acupuncture Course', 'Recommended treatment plan:\n- Frequency: 1-2x per week for ___ weeks\n- Reassess after ___ sessions\n- Home care: rest, gentle stretching, apply heat/ice as appropriate\n- Dietary recommendations: ___', 1, true),
('treatment_plan', 'Herbal + Acupuncture Combined', 'Recommended treatment plan:\n- Acupuncture: 1x per week for ___ weeks\n- Herbal formula: ___ for ___ days\n- Dietary modifications: ___\n- Lifestyle recommendations: ___\n- Follow-up in ___ weeks to reassess', 2, true),

-- Post-treatment Instructions templates
('instructions', 'Post-Acupuncture Care', 'After your acupuncture treatment:\n- Drink plenty of water\n- Avoid strenuous exercise for 24 hours\n- Some mild soreness at needle sites is normal\n- Rest if you feel tired\n- Avoid alcohol and heavy meals today\n- Contact the clinic if you experience any unusual symptoms', 1, true),
('instructions', 'Herbal Medicine Instructions', 'How to prepare your herbal decoction:\n1. Soak herbs in cold water for 30 minutes\n2. Bring to a boil, then reduce to low heat\n3. Simmer for 20-30 minutes\n4. Strain and drink warm\n5. Re-decoct with fresh water for a second dose\n6. Take twice daily, morning and evening\n7. Store unused portion in the refrigerator\n8. Avoid raw, cold, greasy, and spicy foods during treatment', 2, true),
('instructions', 'Dietary Advice - Qi Deficiency', 'Dietary recommendations for Qi deficiency:\n- Eat warm, cooked foods (soups, stews, congee)\n- Include: sweet potato, rice, oats, chicken, beef, mushrooms, dates\n- Avoid: raw/cold foods, iced drinks, excessive dairy, greasy foods\n- Eat regular meals at consistent times\n- Do not overeat; stop at 70% full\n- Gentle exercise such as walking or tai chi', 3, true),
('instructions', 'Dietary Advice - Blood Stasis', 'Dietary recommendations for Blood stasis:\n- Include: turmeric, ginger, garlic, onions, dark leafy greens, beets\n- Include: small amounts of vinegar in cooking\n- Avoid: excessive cold/raw foods, iced drinks\n- Stay physically active with regular moderate exercise\n- Practice stress reduction techniques\n- Avoid sitting for prolonged periods', 4, true);
