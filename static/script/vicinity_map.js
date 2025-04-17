const polygons = [
    { coords: [270,34,289,35,289,50,270,49] },
    { coords: [270,53,288,53,288,71,269,69] },
    { coords: [321,69,336,71,337,89,318,88] },
    { coords: [278,84,298,87,295,94,278,91] },
    { coords: [360,53,378,53,379,70,357,69] },
    { coords: [381,54,398,54,395,70,382,69] },
    { coords: [484,42,502,42,502,50,483,50] },
    { coords: [475,52,494,53,495,62,475,62] },
    { coords: [481,78,499,80,499,94,483,94] },
    { coords: [464,95,487,96,488,113,463,113] },
    { coords: [493,97,510,98,511,114,491,114] },
    { coords: [507,26,523,26,525,39,507,38] },
    { coords: [544,79,561,81,559,94,541,93] },
    { coords: [563,82,580,84,580,96,562,94] },
    { coords: [587,65,606,66,606,81,585,80] },
    { coords: [543,68,523,67,524,77,543,78] },
    { coords: [525,61,545,61,544,67,523,66] },
    { coords: [526,45,547,47,547,61,525,59] },
    { coords: [467,30,490,31,487,40,469,39] },
    { coords: [629,77,649,79,647,86,628,87] },
    { coords: [649,75,669,78,668,91,650,89] },
    { coords: [581,100,600,103,599,117,577,116] },
    { coords: [603,104,618,107,619,124,600,122] },
    { coords: [312,107,331,109,331,125,309,122] },
    { coords: [331,125,347,129,347,138,328,133] },
    { coords: [273,117,293,121,292,130,271,125] },
    { coords: [250,113,271,119,267,134,246,129] },
    { coords: [206,103,226,110,220,124,201,117] },
    { coords: [231,115,248,121,245,132,228,126] },
    { coords: [298,135,315,138,313,150,295,146] },
    { coords: [295,149,311,154,311,172,290,165] },
    { coords: [275,137,290,142,289,152,273,146] },
    { coords: [248,138,270,146,263,159,244,152] },
    { coords: [315,142,335,147,331,175,312,170] },
    { coords: [340,151,379,158,375,175,335,166] },
    { coords: [348,171,368,176,365,189,344,184] },
    { coords: [344,189,364,192,361,207,342,204] },
    { coords: [255,180,275,184,272,200,253,194] },
    { coords: [281,173,297,175,296,188,279,185] },
    { coords: [251,198,270,205,271,214,249,207] },
    { coords: [276,187,297,188,289,218,271,217] },
    { coords: [248,216,267,218,266,233,248,231] },
    { coords: [269,218,288,220,287,233,266,229] },
    { coords: [267,233,287,234,283,251,264,249] },
    { coords: [287,235,307,238,303,254,287,252] },
    { coords: [311,210,336,209,337,231,311,231] },
    { coords: [254,100,275,103,271,119,249,112] },
    { coords: [276,109,294,114,295,121,275,116] },
    { coords: [298,185,318,192,312,206,295,201] },
    { coords: [293,203,309,207,306,222,291,219] },
    { coords: [307,251,326,250,330,268,306,266] },
    { coords: [329,251,351,254,349,268,329,268] },
    { coords: [305,266,330,268,327,286,302,282] },
    { coords: [347,210,366,210,369,225,345,226] },
    { coords: [371,118,412,124,410,140,369,134] },
    { coords: [385,101,407,104,406,121,380,118] },
    { coords: [391,159,410,159,411,177,387,175] },
    { coords: [387,175,409,178,407,194,387,192] },
    { coords: [295,109,296,125,309,125,311,109] },
    { coords: [275,99,292,103,293,113,275,107] },
    { coords: [223,129,241,133,240,151,221,145] },
    { coords: [184,231,211,233,207,259,179,258] },
    { coords: [232,265,256,265,257,284,231,281] },
    { coords: [387,265,415,264,412,280,387,278] },
    { coords: [113,148,135,151,132,166,111,165] },
    { coords: [134,152,158,155,156,168,132,167] },
    { coords: [176,169,203,175,198,191,174,185] },
    { coords: [204,177,224,181,221,198,197,193] },
    { coords: [131,170,158,169,157,181,129,180] },
    { coords: [62,163,87,163,85,180,59,180] },
    { coords: [105,188,129,192,125,206,103,201] },
    { coords: [643,99,662,101,662,122,639,120] },
    { coords: [560,152,591,154,590,180,561,177] },
    { coords: [617,124,637,125,637,137,617,133] },
    { coords: [616,142,634,144,634,134,618,133] },
    { coords: [107,176,128,178,131,191,103,187] },
    { coords: [101,211,119,213,116,233,96,227] },
    { coords: [94,133,118,136,118,148,94,147] },
    { coords: [93,149,108,149,108,163,91,163] },
    { coords: [267,286,295,288,293,308,269,308] },
    { coords: [519,146,543,149,540,169,519,163] },
    { coords: [436,248,459,250,457,262,436,261] },
    { coords: [388,199,409,202,409,211,385,208] },
    { coords: [387,208,384,219,403,220,403,211] },
    { coords: [403,218,403,208,423,210,422,223] },
    { coords: [423,209,443,212,441,223,423,221] },
    { coords: [460,250,480,252,480,262,457,262] },
    { coords: [457,263,481,263,482,276,458,275] },
    { coords: [431,266,455,269,456,287,431,285] },
    { coords: [421,194,447,198,443,205,422,202] },
    { coords: [512,211,534,212,535,230,509,228] },
    { coords: [86,171,105,173,102,184,86,180] },
    { coords: [83,197,101,196,100,209,83,205] },
    { coords: [73,224,97,225,96,238,73,234] },
    { coords: [455,274,479,276,476,293,455,293] },
    { coords: [426,290,449,291,449,312,423,310] },
    { coords: [489,248,508,246,509,261,487,261] },
    { coords: [487,271,509,269,507,281,484,282] },
    { coords: [511,278,532,278,530,294,508,293] },
    { coords: [514,265,532,268,532,279,512,277] },
    { coords: [471,294,494,297,491,307,469,305] },
    { coords: [546,250,565,254,565,269,544,265] },
    { coords: [567,252,586,254,583,274,564,270] },
    { coords: [538,273,558,274,558,292,536,290] },
    { coords: [558,273,584,275,581,289,559,289] },
    { coords: [588,255,611,256,611,272,590,272] },
    { coords: [567,290,590,291,591,314,566,313] },
    { coords: [531,291,554,293,554,307,530,304] },
    { coords: [588,273,610,273,608,283,587,282] },
    { coords: [480,161,499,161,501,177,479,177] },
    { coords: [655,136,636,135,635,145,654,147] },
    { coords: [630,160,663,165,659,175,629,171] },
    { coords: [643,152,661,155,662,164,640,162] },
    { coords: [308,296,333,295,333,318,308,315] },
    { coords: [334,298,358,298,355,319,333,318] },
    { coords: [397,295,420,297,420,317,395,316] },
    { coords: [394,316,418,318,419,333,395,328] },
    { coords: [441,315,420,315,421,332,441,336] },
    { coords: [443,320,463,318,464,339,442,336] },
    { coords: [463,312,483,315,482,343,463,345] },
    { coords: [507,318,507,336,483,336,481,312] },
    { coords: [508,325,531,325,531,344,506,340] },
    { coords: [573,200,573,209,594,213,594,199] },
    { coords: [637,267,618,263,614,283,633,290] },
    { coords: [639,267,660,271,655,295,633,289] },
    { coords: [688,110,688,127,664,124,665,110] },
    { coords: [679,141,697,144,698,155,679,152] },
    { coords: [757,48,786,47,788,65,761,68] },
    { coords: [787,73,789,92,763,92,769,73] },
    { coords: [756,156,781,153,781,174,759,174] },
    { coords: [758,207,775,210,775,226,754,222] },
    { coords: [753,220,775,226,773,244,751,239] },
    { coords: [747,257,771,261,771,243,749,239] },
    { coords: [749,259,771,263,770,280,745,274] },
    { coords: [746,273,767,278,767,293,742,291] },
    { coords: [742,316,764,323,763,340,737,336] },
    { coords: [697,231,724,234,722,255,695,251] },
    { coords: [696,253,720,255,717,276,694,271] },
    { coords: [723,234,742,236,742,257,723,253] },
    { coords: [737,258,721,257,715,275,735,277] },
    { coords: [664,247,685,249,684,268,662,264] },
    { coords: [681,172,699,176,694,201,675,197] },
    { coords: [735,125,750,123,755,141,735,144] },
    { coords: [691,89,710,85,714,105,700,109] },
    { coords: [706,117,719,114,724,129,707,134] },
    { coords: [703,178,716,181,712,197,699,193] },
    { coords: [714,165,730,166,731,179,711,179] },
    { coords: [661,264,681,268,681,277,661,273] },
    { coords: [749,205,749,222,731,223,733,204] },
    { coords: [655,309,682,307,684,332,659,334] },
    { coords: [711,288,713,276,734,278,734,290] },
    { coords: [710,288,728,290,728,310,707,308] },
    { coords: [705,309,726,312,724,330,701,329] },
    { coords: [686,310,703,311,703,324,681,322] },
    { coords: [686,286,707,285,707,297,684,297] },
    { coords: [683,297,704,297,704,307,684,308] },
    { coords: [687,329,706,332,707,349,687,348] },
    { coords: [659,341,658,332,682,333,682,342] },
    { coords: [608,344,626,343,627,364,607,362] },
    { coords: [646,345,627,343,628,363,645,364] },
    { coords: [663,349,646,350,648,363,667,364] },
    { coords: [578,344,597,345,596,361,577,360] },
    { coords: [508,313,531,314,531,324,507,325] },
    { coords: [612,212,636,214,636,225,609,220] },
    { coords: [608,230,632,236,633,224,610,220] },
    { coords: [47,217,68,213,69,236,46,234] },
    { coords: [44,299,73,298,74,330,41,328] },
    { coords: [75,244,95,246,97,258,74,253] },
    { coords: [75,257,95,255,96,275,72,270] },
    { coords: [119,256,100,252,96,264,118,268] },
    { coords: [99,265,119,269,118,279,95,275] },
    { coords: [135,237,163,241,156,255,136,251] },
    { coords: [125,259,151,265,147,278,122,272] },
    { coords: [121,275,139,277,135,295,115,290] },
    { coords: [142,280,167,283,159,302,135,297] },
    { coords: [74,286,93,287,97,302,74,298] },
    { coords: [97,286,117,288,116,306,96,303] },
    { coords: [136,310,115,305,116,292,137,296] },
    { coords: [73,315,97,316,98,337,74,333] },
    { coords: [168,342,191,346,191,365,166,363] },
    { coords: [85,357,107,359,107,378,83,377] },
    { coords: [108,360,138,361,138,381,108,380] },
    { coords: [150,361,175,365,173,375,147,372] },
    { coords: [151,374,171,373,175,395,148,394] },
    { coords: [239,297,261,298,262,316,239,314] },
    { coords: [271,324,295,324,295,346,269,343] },
    { coords: [293,325,320,324,320,346,296,344] },
    { coords: [296,347,320,348,321,367,296,366] },
    { coords: [248,350,275,352,276,369,252,368] },
    { coords: [338,338,359,338,359,356,339,354] },
    { coords: [336,354,355,353,357,367,333,369] },
    { coords: [357,349,380,349,383,365,357,363] },
    { coords: [379,366,356,364,353,383,380,383] },
    { coords: [287,373,310,370,313,388,285,389] },
    { coords: [311,371,335,369,335,391,313,389] },
    { coords: [227,381,257,383,259,401,224,399] },
    { coords: [525,343,550,344,546,360,522,357] },
    { coords: [285,391,311,388,311,408,287,410] },
    { coords: [311,391,333,392,336,410,312,408] },
    { coords: [286,410,311,410,312,429,286,427] },
    { coords: [312,409,332,409,336,429,311,429] },
    { coords: [285,428,310,428,311,445,285,446] },
    { coords: [310,428,335,430,336,446,310,446] },
    { coords: [335,421,358,423,359,445,338,445] },
    { coords: [285,446,314,445,314,469,284,469] },
    { coords: [340,446,371,445,371,467,346,468] },
    { coords: [404,381,438,382,436,408,403,409] },
    { coords: [369,405,391,405,391,433,366,433] },
    { coords: [371,384,404,382,403,405,370,405] },
    { coords: [401,410,437,409,438,434,403,433] },
    { coords: [403,434,435,434,439,461,404,461] },
    { coords: [465,382,436,382,437,405,464,406] },
    { coords: [440,409,463,410,465,434,439,431] },
    { coords: [439,435,465,433,467,457,439,458] },
    { coords: [469,385,504,386,501,413,468,410] },
    { coords: [465,412,495,414,492,436,464,434] },
    { coords: [467,434,492,436,494,457,467,457] },
    { coords: [467,458,491,459,491,477,467,477] },
    { coords: [522,393,551,395,549,415,520,414] },
    { coords: [529,421,552,420,551,438,527,437] },
    { coords: [500,437,523,437,523,456,502,455] },
    { coords: [525,438,547,439,547,460,524,459] },
    { coords: [507,418,526,420,527,437,506,436] },
    { coords: [558,388,580,388,579,402,557,402] },
    { coords: [551,420,575,420,576,440,550,438] },
    { coords: [547,439,574,440,573,458,548,458] },
    { coords: [587,388,623,390,622,417,583,415] },
    { coords: [579,417,606,419,606,442,576,441] },
    { coords: [576,441,606,443,606,462,576,461] },
    { coords: [614,416,642,417,641,440,614,439] },
    { coords: [611,441,634,441,635,459,611,461] },
    { coords: [573,459,605,463,603,479,572,476] },
    { coords: [643,396,667,397,663,418,644,420] },
    { coords: [610,461,633,462,634,478,610,478] },
    { coords: [643,417,663,418,664,440,643,440] },
    { coords: [638,443,664,442,665,463,637,462] },
    { coords: [635,461,663,463,663,478,635,479] },
    { coords: [669,413,687,412,688,432,667,432] },
    { coords: [687,434,708,436,704,454,684,453] },
    { coords: [664,459,687,459,689,478,666,477] },
    { coords: [691,393,714,393,712,412,689,412] },
    { coords: [716,379,738,380,736,396,713,393] },
    { coords: [714,393,733,395,732,412,712,412] },
    { coords: [710,413,730,412,730,431,707,429] },
    { coords: [707,429,727,431,726,451,708,451] },
    { coords: [707,452,723,452,723,468,706,468] },
    { coords: [726,451,747,451,746,469,725,468] },
    { coords: [749,443,771,445,769,464,746,460] },
    { coords: [752,422,774,428,771,445,749,445] },
    { coords: [755,406,775,407,775,428,752,423] },
    { coords: [757,389,779,393,778,409,753,405] },
    { coords: [762,368,779,374,783,393,758,389] },
    { coords: [731,350,754,349,754,365,731,364] },
    { coords: [739,366,758,368,758,384,739,381] },
    { coords: [738,381,756,383,753,395,736,396] },
    { coords: [735,396,751,397,754,411,733,410] },
    { coords: [731,412,751,410,749,428,730,429] },
    { coords: [401,348,428,350,430,376,402,374] },
    { coords: [427,352,449,353,450,369,430,368] },
    { coords: [429,369,452,366,456,382,431,381] },
    { coords: [450,362,475,362,477,383,456,380] },
    { coords: [62,373,83,372,84,390,63,390] },
    { coords: [39,391,65,392,65,412,37,411] },
    { coords: [66,391,93,392,92,410,66,412] },
    { coords: [38,413,61,413,63,437,39,436] },
    { coords: [68,413,89,411,88,429,67,429] },
    { coords: [64,429,90,429,89,447,64,447] },
    { coords: [63,447,91,447,91,470,62,469] },
    { coords: [84,377,120,380,121,393,83,391] },
    { coords: [95,412,119,412,119,430,94,432] },
    { coords: [95,449,119,451,119,471,93,468] },
    { coords: [94,431,117,430,119,451,93,448] },
    { coords: [118,395,94,392,94,412,120,413] },
    { coords: [124,391,146,393,146,405,123,404] },
    { coords: [121,409,146,412,149,432,123,432] },
    { coords: [121,432,147,431,147,452,123,450] },
    { coords: [122,451,147,453,146,473,123,470] },
    { coords: [150,405,172,405,174,416,146,416] },
    { coords: [148,415,174,415,175,431,148,431] },
    { coords: [148,431,175,431,175,451,148,451] },
    { coords: [147,453,176,451,177,473,148,471] },
    { coords: [175,415,198,413,199,431,175,430] },
    { coords: [175,431,200,430,200,451,175,451] },
    { coords: [201,452,176,452,177,473,203,473] },
    { coords: [198,428,224,429,225,454,202,454] },
    { coords: [202,456,223,456,226,472,204,472] },
    { coords: [227,431,251,434,250,454,226,453] },
    { coords: [227,454,249,455,248,472,226,473] },
    { coords: [250,435,275,436,275,455,251,456] },
    { coords: [249,455,275,455,275,474,250,474] },
    { coords: [271,409,244,407,241,420,270,422] },
    { coords: [245,421,273,421,270,436,242,433] },
    { coords: [215,406,244,407,239,419,215,417] },
    { coords: [219,418,240,418,242,432,218,430] },
    { coords: [199,416,218,416,221,429,201,429] },
    { coords: [38,182,59,182,58,204,36,201] },
    { coords: [372,453,396,453,395,477,373,477] },
    { coords: [525,460,552,461,553,470,524,471] },
    { coords: [251,369,274,369,275,383,253,382] },
    { coords: [549,365,575,364,576,376,550,375] },
    { coords: [592,143,571,141,567,152,591,152] },
    { coords: [44,490,67,490,67,507,45,508] },
    { coords: [45,511,69,511,67,533,47,532] },
    { coords: [42,535,65,534,65,552,42,552] },
    { coords: [42,554,65,554,66,564,41,564] },
    { coords: [39,564,63,564,64,583,40,582] },
    { coords: [67,562,91,562,89,582,67,583] },
    { coords: [69,537,89,536,90,560,67,560] },
    { coords: [69,524,89,523,90,535,69,535] },
    { coords: [68,513,92,512,91,523,69,523] },
    { coords: [69,489,94,489,91,498,70,498] },
    { coords: [71,498,91,498,92,511,70,510] },
    { coords: [96,487,119,487,119,499,93,499] },
    { coords: [95,498,115,498,117,513,94,511] },
    { coords: [91,513,116,514,118,527,91,528] },
    { coords: [91,527,119,527,118,538,93,538] },
    { coords: [95,541,117,540,118,550,94,550] },
    { coords: [91,552,119,551,116,563,93,563] },
    { coords: [92,564,112,563,112,583,92,583] },
    { coords: [93,585,113,583,113,594,92,595] },
    { coords: [121,488,139,488,138,499,119,497] },
    { coords: [119,500,139,499,137,510,119,510] },
    { coords: [119,511,138,511,139,522,119,522] },
    { coords: [119,524,138,523,137,535,119,534] },
    { coords: [120,535,139,536,139,545,120,545] },
    { coords: [121,547,137,547,138,561,121,561] },
    { coords: [118,563,137,564,137,580,118,580] },
    { coords: [115,580,140,581,138,594,115,595] },
    { coords: [140,489,162,489,160,499,139,499] },
    { coords: [139,499,161,500,159,510,141,510] },
    { coords: [140,511,163,510,163,523,140,523] },
    { coords: [139,522,161,521,161,533,141,533] },
    { coords: [141,535,163,535,161,547,143,546] },
    { coords: [140,550,159,549,160,562,141,561] },
    { coords: [139,564,163,564,160,579,141,580] },
    { coords: [142,584,159,583,161,594,142,594] },
    { coords: [164,490,188,490,188,499,164,498] },
    { coords: [164,501,187,501,188,512,163,511] },
    { coords: [166,512,189,512,187,523,166,522] },
    { coords: [163,523,188,524,187,535,163,533] },
    { coords: [166,537,185,537,185,548,165,548] },
    { coords: [163,550,188,549,189,565,163,565] },
    { coords: [167,568,188,567,187,578,168,579] },
    { coords: [166,581,187,581,187,594,166,595] },
    { coords: [191,490,217,490,217,510,190,509] },
    { coords: [193,512,213,511,214,528,193,528] },
    { coords: [190,531,216,531,215,548,191,549] },
    { coords: [191,550,216,550,216,564,190,565] },
    { coords: [190,565,214,564,214,578,192,580] },
    { coords: [191,583,217,581,218,597,191,597] },
    { coords: [218,490,240,491,240,510,217,510] },
    { coords: [219,513,243,512,241,528,219,528] },
    { coords: [217,530,243,530,243,548,218,548] },
    { coords: [215,549,243,549,243,563,215,563] },
    { coords: [216,564,239,565,239,578,216,578] },
    { coords: [217,580,245,579,245,595,219,596] },
    { coords: [246,491,267,492,267,512,247,512] },
    { coords: [244,515,267,514,266,528,245,528] },
    { coords: [244,530,267,530,267,547,242,547] },
    { coords: [246,548,267,548,267,561,247,562] },
    { coords: [245,562,263,561,265,579,247,579] },
    { coords: [248,580,267,580,267,595,247,595] },
    { coords: [272,492,291,493,291,511,271,510] },
    { coords: [270,513,291,513,291,529,271,528] },
    { coords: [270,545,295,545,294,531,270,531] },
    { coords: [270,548,293,547,293,562,269,562] },
    { coords: [267,565,294,564,294,579,269,580] },
    { coords: [269,582,291,581,291,596,271,596] },
    { coords: [293,492,317,493,318,511,293,511] },
    { coords: [293,513,319,512,317,530,294,531] },
    { coords: [295,534,319,533,317,548,295,547] },
    { coords: [295,548,318,547,319,560,295,560] },
    { coords: [296,564,312,563,312,577,295,577] },
    { coords: [294,580,312,580,314,596,293,595] },
    { coords: [319,494,343,492,344,510,319,510] },
    { coords: [318,512,345,511,344,530,319,530] },
    { coords: [320,534,344,533,344,547,320,546] },
    { coords: [319,549,346,550,346,565,321,564] },
    { coords: [318,565,337,565,336,577,316,577] },
    { coords: [315,581,336,582,336,597,317,597] },
    { coords: [339,575,361,574,360,598,339,596] },
    { coords: [345,493,370,493,370,511,345,511] },
    { coords: [346,514,371,514,370,529,347,528] },
    { coords: [347,532,367,532,367,547,348,547] },
    { coords: [346,551,370,550,370,565,348,565] },
    { coords: [373,494,398,494,399,511,373,511] },
    { coords: [373,515,398,516,398,530,373,529] },
    { coords: [371,531,398,532,399,548,371,548] },
    { coords: [371,550,398,549,397,564,371,563] },
    { coords: [370,567,397,566,397,580,371,581] },
    { coords: [371,582,396,583,396,599,372,598] },
    { coords: [400,495,421,494,422,511,400,510] },
    { coords: [399,512,423,512,423,530,400,530] },
    { coords: [401,531,421,531,421,546,401,547] },
    { coords: [398,549,422,549,421,563,399,563] },
    { coords: [399,565,421,565,422,580,399,580] },
    { coords: [399,583,420,581,421,598,399,597] },
    { coords: [423,492,449,492,449,512,423,511] },
    { coords: [423,513,447,513,448,530,424,530] },
    { coords: [423,531,447,531,446,547,424,547] },
    { coords: [423,549,444,548,446,564,425,563] },
    { coords: [425,566,445,566,446,580,425,579] },
    { coords: [422,581,446,582,447,599,422,598] },
    { coords: [451,493,471,492,472,512,451,510] },
    { coords: [449,510,475,513,475,527,449,527] },
    { coords: [447,528,473,527,474,547,449,547] },
    { coords: [445,547,475,546,475,563,446,562] },
    { coords: [445,565,475,564,475,583,447,582] },
    { coords: [446,582,475,582,475,600,447,600] },
    { coords: [475,494,499,495,499,511,475,510] },
    { coords: [475,511,499,513,500,528,473,527] },
    { coords: [473,527,502,526,500,546,473,545] },
    { coords: [473,546,499,548,499,565,475,563] },
    { coords: [475,563,495,564,495,580,475,580] },
    { coords: [474,584,497,584,495,600,477,599] },
    { coords: [499,494,527,495,527,515,499,513] },
    { coords: [498,513,524,513,524,528,498,525] },
    { coords: [500,527,522,529,523,545,499,546] },
    { coords: [497,546,519,545,519,563,497,563] },
    { coords: [497,565,499,579,518,581,518,565] },
    { coords: [496,582,519,582,519,599,497,598] },
    { coords: [527,494,550,495,550,515,527,513] },
    { coords: [524,513,550,516,547,529,524,529] },
    { coords: [523,532,545,532,544,546,523,546] },
    { coords: [519,546,547,547,547,565,519,565] },
    { coords: [520,566,545,566,544,586,518,585] },
    { coords: [519,587,543,587,543,599,519,598] },
    { coords: [551,495,571,494,572,514,548,514] },
    { coords: [548,516,571,512,571,531,546,530] },
    { coords: [547,531,569,533,570,550,547,549] },
    { coords: [545,547,569,549,569,567,548,565] },
    { coords: [545,565,567,566,567,585,544,584] },
    { coords: [543,584,566,584,566,599,543,599] },
    { coords: [572,494,595,494,595,513,571,511] },
    { coords: [571,511,596,513,595,530,569,530] },
    { coords: [570,532,592,532,592,549,569,548] },
    { coords: [568,550,592,550,590,567,568,565] },
    { coords: [566,566,590,568,590,588,567,586] },
    { coords: [566,587,590,589,591,600,567,600] },
    { coords: [597,495,618,496,618,516,596,514] },
    { coords: [595,514,619,515,617,532,595,530] },
    { coords: [592,530,615,532,615,552,589,549] },
    { coords: [591,550,614,550,612,566,590,565] },
    { coords: [588,565,614,566,611,583,590,584] },
    { coords: [591,585,609,585,608,599,591,599] },
    { coords: [618,494,638,494,638,514,618,513] },
    { coords: [617,514,635,515,633,532,614,531] },
    { coords: [615,532,633,530,632,548,614,549] },
    { coords: [614,550,633,549,633,567,613,566] },
    { coords: [612,569,631,569,632,585,611,585] },
    { coords: [608,586,630,584,630,599,610,599] },
    { coords: [638,495,660,495,661,512,635,512] },
    { coords: [634,514,658,512,658,535,633,535] },
    { coords: [633,534,660,533,657,550,634,549] },
    { coords: [634,550,655,551,656,568,634,566] },
    { coords: [631,566,655,566,655,589,631,585] },
    { coords: [630,586,653,589,654,599,631,599] },
    { coords: [660,495,685,495,684,517,658,516] },
    { coords: [659,515,682,518,680,537,659,535] },
    { coords: [658,534,679,537,679,555,657,553] },
    { coords: [656,553,678,556,678,576,655,572] },
    { coords: [654,575,677,577,676,598,655,598] },
    { coords: [685,495,710,495,707,518,682,516] },
    { coords: [681,516,708,517,705,538,679,537] },
    { coords: [679,536,704,538,704,558,678,556] },
    { coords: [676,554,703,557,703,574,676,572] },
    { coords: [677,573,699,575,699,595,675,593] },
    { coords: [708,495,733,497,731,520,707,516] },
    { coords: [708,516,731,519,730,537,708,536] },
    { coords: [706,542,726,542,727,560,703,558] },
    { coords: [727,542,748,542,749,564,727,562] },
    { coords: [702,559,726,561,725,577,701,575] },
    { coords: [697,574,720,577,719,597,697,593] },
    { coords: [735,498,759,500,757,520,734,517] },
    { coords: [730,521,755,520,754,537,732,537] },
    // start of mesjiamdksnds
    { coords: [168,52,160,61,157,84,195,98,202,75,204,64] }, // 476
    { coords: [215,55,210,62,210,82,241,90,249,70,245,61] },
    { coords: [114,42,106,49,108,65,113,72,143,73,149,55,143,46] },
    { coords: [65,40,58,52,61,68,93,75,100,51,91,44] },
    { coords: [61,70,55,81,58,95,89,102,91,76] },
    { coords: [105,75,100,86,102,102,133,105,137,85,132,78] },
    { coords: [57,99,50,110,54,126,87,132,91,108,83,102] },
    { coords: [102,106,97,114,102,133,133,138,137,114,129,108] },
    { coords: [53,128,47,140,50,157,82,161,87,133] },
    { coords: [183,141,175,151,176,165,207,178,212,151] },
    { coords: [133,192,126,203,126,219,163,226,167,200] },
    { coords: [211,196,204,207,204,222,238,230,242,204] },
    { coords: [515,94,538,87,546,95,544,121,512,120] },
    { coords: [701,47,703,73,735,70,742,51,731,43] },
    { coords: [727,73,728,99,757,94,765,78,755,67] },
    { coords: [749,99,749,121,778,120,783,105,773,97] },
    { coords: [749,126,754,152,779,148,789,133,779,124] },
    { coords: [757,178,755,203,789,202,794,187,783,176] },
    { coords: [746,293,740,316,769,324,782,312,777,298] },
    { coords: [169,266,165,279,168,293,200,295,202,269] },
    { coords: [204,286,198,298,199,312,234,316,234,287] },
    { coords: [161,297,155,309,156,322,192,328,195,301] },
    { coords: [214,332,208,349,211,365,241,367,245,336] },
    { coords: [38,344,28,361,38,371,69,371,67,347] },
    { coords: [102,330,97,345,102,359,130,359,130,332] },
    { coords: [183,372,177,387,181,401,215,403,215,373] },
    { coords: [477,359,477,383,503,386,509,372,507,359] },
    { coords: [628,371,629,396,660,398,667,386,661,371] },
    { coords: [668,367,667,391,697,394,706,385,700,369] },
    { coords: [759,344,752,370,780,376,793,362,786,348] } // 505
    // end of masueleumscs
];

let scale = 1;
let naturalWidth, naturalHeight;
let isScissorMode = false;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;


const imageContainer = document.getElementById('image-container');
const img = document.getElementById('responsive-image');
const mapContainer = document.getElementById('map-container');
const mapViewport = document.getElementById('map-viewport');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetZoomBtn = document.getElementById('reset-zoom');
const zoomLevelDisplay = document.getElementById('zoom-level');
const scissorModeBtn = document.getElementById('scissor-mode-btn');


function createHighlights() {
    polygons.forEach((polygon, index) => {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';
        highlight.id = `polygon-${index}`;
        
       
        const minX = Math.min(...polygon.coords.filter((_, i) => i % 2 === 0));
        const minY = Math.min(...polygon.coords.filter((_, i) => i % 2 !== 0));
        const maxX = Math.max(...polygon.coords.filter((_, i) => i % 2 === 0));
        const maxY = Math.max(...polygon.coords.filter((_, i) => i % 2 !== 0));
        
        highlight.style.left = `${minX}px`;
        highlight.style.top = `${minY}px`;
        highlight.style.width = `${maxX - minX}px`;
        highlight.style.height = `${maxY - minY}px`;
        

        const polygonPoints = [];
        for (let i = 0; i < polygon.coords.length; i += 2) {
            const x = polygon.coords[i] - minX;
            const y = polygon.coords[i + 1] - minY;
            polygonPoints.push(`${x}px ${y}px`);
        }
        highlight.style.clipPath = `polygon(${polygonPoints.join(', ')})`;
        
        highlight.addEventListener('click', () => {
            fetch(`/api/slot/${index + 1}`)
                .then(res => res.json())
                .then(data => {
                    const info = document.getElementById('plot-info');

                    // No deceased assigned
                    if (!data || data.length === 0) {
                        info.innerHTML = `
                            <h4>Slot ID: ${index + 1}</h4>
                            <p><strong>Slot Type:</strong> Unknown</p>
                            <p><strong>Availability:</strong> Unknown</p>
                            <p><strong>Status:</strong> No deceased assigned.</p>
                        `;
                        return;
                    }

                    const slotId = index + 1;

                    // Show all deceased + slot info (assuming same slot info across entries)
                    const deceasedHtml = data.map(d => `
                        <div class="deceased-entry">
                            <p><strong>Deceased Name:</strong> ${d.name}</p>
                            <p><strong>Birth Date:</strong> ${new Date(d.birth_date).toLocaleDateString()}</p>
                            <p><strong>Death Date:</strong> ${new Date(d.death_date).toLocaleDateString()}</p>
                            <hr>
                        </div>
                    `).join('');

                    const slotType = data[0].slot_type || "Unknown";
                    const availability = data[0].availability || "Unknown";
                    const clientId = data[0].client_id || "Unassigned";
                    const price = data[0].price !== undefined ? `₱${data[0].price.toFixed(2)}` : "N/A";

                    if (availability === "available") {
                        info.innerHTML = `
                            <h4>Slot ID: ${slotId}</h4>
                            <p><strong>Slot Type:</strong> ${slotType}</p>
                            <p><strong>Availability:</strong> ${availability}</p>
                            <p><strong>Price:</strong> ${price}</p>
                            <a href="/dashboard/buyaplan" class="map-btn">Buy This Plan</a>
                        `;
                    } else {
                        info.innerHTML = `
                            <h4>Slot ID: ${slotId}</h4>
                            <p><strong>Slot Type:</strong> ${slotType}</p>
                            <p><strong>Availability:</strong> ${availability}</p>
                            <p><strong>Client ID:</strong> ${clientId}</p>
                            ${deceasedHtml}
                        `;
                    }
                })
                .catch(() => {
                    document.getElementById('plot-info').innerHTML = '<p>No deceased assigned to this slot.</p>';
                });
        });

        
        imageContainer.appendChild(highlight);
    });
}


function updateZoom() {
    imageContainer.style.transform = `scale(${scale})`;
    zoomLevelDisplay.textContent = `${Math.round(scale * 100)}%`;

    imageContainer.style.width = `${naturalWidth * scale}px`;
    imageContainer.style.height = `${naturalHeight * scale}px`;

    if (!isScissorMode) {
        centerView();
    }
}

function centerView() {
    mapContainer.scrollLeft = (imageContainer.offsetWidth - mapContainer.clientWidth) / 2;
    mapContainer.scrollTop = (imageContainer.offsetHeight - mapContainer.clientHeight) / 2;
}

function zoom(factor, centerX, centerY) {
    const oldScale = scale;
    scale *= factor;

    scale = Math.max(0.1, Math.min(scale, 5));
    
    if (scale !== oldScale) {

        if (centerX !== undefined && centerY !== undefined) {
            const containerRect = mapContainer.getBoundingClientRect();
            const mouseX = centerX - containerRect.left;
            const mouseY = centerY - containerRect.top;
            
            const scrollX = mouseX + mapContainer.scrollLeft;
            const scrollY = mouseY + mapContainer.scrollTop;
            
            updateZoom();

            mapContainer.scrollLeft = scrollX * (scale / oldScale) - mouseX;
            mapContainer.scrollTop = scrollY * (scale / oldScale) - mouseY;
        } else {
            updateZoom();
        }
    }
}

function resetZoom() {
    scale = 1;
    updateZoom();
    centerView();
}

function toggleScissorMode() {
    isScissorMode = !isScissorMode;
    
    if (isScissorMode) {
        scissorModeBtn.textContent = 'Exit Scissor Mode';
        mapViewport.classList.add('scissor-mode-active');
        mapContainer.style.cursor = 'grab';
    } else {
        scissorModeBtn.textContent = 'Scissor Mode';
        mapViewport.classList.remove('scissor-mode-active');
        mapContainer.style.cursor = '';
        centerView();
    }
}

function init() {

    img.onload = function() {
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;

        imageContainer.style.width = `${naturalWidth}px`;
        imageContainer.style.height = `${naturalHeight}px`;
        
        createHighlights();
        resetZoom();

        zoomInBtn.addEventListener('click', () => zoom(1.2));
        zoomOutBtn.addEventListener('click', () => zoom(0.8));
        resetZoomBtn.addEventListener('click', resetZoom);

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    zoom(1.2);
                } else if (e.key === '-') {
                    e.preventDefault();
                    zoom(0.8);
                } else if (e.key === '0') {
                    e.preventDefault();
                    resetZoom();
                }
            }
        });

        mapContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            zoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
        });

        scissorModeBtn.addEventListener('click', toggleScissorMode);

        mapContainer.addEventListener('mousedown', (e) => {
            if (isScissorMode && e.button === 0) { 
                isDragging = true;
                startX = e.pageX - mapContainer.offsetLeft;
                startY = e.pageY - mapContainer.offsetTop;
                scrollLeft = mapContainer.scrollLeft;
                scrollTop = mapContainer.scrollTop;
                mapContainer.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !isScissorMode) return;
            const x = e.pageX - mapContainer.offsetLeft;
            const y = e.pageY - mapContainer.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            mapContainer.scrollLeft = scrollLeft - walkX;
            mapContainer.scrollTop = scrollTop - walkY;
        });
        
        document.addEventListener('mouseup', () => {
            if (isScissorMode) {
                isDragging = false;
                mapContainer.style.cursor = 'grab';
            }
        });
        
        window.addEventListener('resize', () => {
            if (!isScissorMode) {
                centerView();
            }
        });
    };

    if (img.complete && img.naturalWidth !== 0) {
        img.onload();
    }
}

init();