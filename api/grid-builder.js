// Massive word list for crossword filling
const BASE_FILLER = {
  3: ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO", "BOY", "DID", "ITS", "LET", "MAY", "SAY", "SHE", "TOO", "USE", "ACE", "AGE", "AGO", "AID", "AIM", "AIR", "ART", "ASK", "ATE", "BAD", "BAG", "BAN", "BAR", "BAT", "BAY", "BED", "BEE", "BET", "BIG", "BIT", "BOX", "BUG", "BUS", "BUY", "CAR", "CAT", "COP", "COW", "CRY", "CUP", "CUT", "DAM", "DEN", "DEW", "DIE", "DIG", "DOC", "DOG", "DOT", "DRY", "DUE", "DYE", "EAR", "EAT", "EEL", "EGG", "ELF", "ELM", "END", "ERA", "EVE", "EWE", "EYE", "FAR", "FAT", "FAX", "FED", "FEE", "FEW", "FIG", "FIN", "FIT", "FLY", "FOE", "FOG", "FOX", "FRY", "FUN", "FUR", "GAP", "GAS", "GAY", "GEL", "GEM", "GET", "GNU", "GOD", "GOT", "GUM", "GUN", "GUY", "GYM", "HAD", "HAM", "HAT", "HAY", "HEM", "HEN", "HER", "HEX", "HEY", "HID", "HIM", "HIP", "HIS", "HIT", "HOE", "HOG", "HOP", "HOT", "HOW", "HUB", "HUE", "HUG", "HUM", "HUT", "ICE", "ICY", "ILL", "INK", "INN", "ION", "IRE", "IRK", "ITS", "JAM", "JAR", "JAW", "JAY", "JET", "JOB", "JOG", "JOY", "JUG", "KEY", "KID", "KIT", "LAB", "LAD", "LAP", "LAW", "LAY", "LEA", "LED", "LEG", "LET", "LID", "LIE", "LIP", "LIT", "LOG", "LOT", "LOW", "MAD", "MAN", "MAP", "MAR", "MAT", "MAY", "MEN", "MET", "MID", "MIX", "MOB", "MOM", "MOP", "MOW", "MUD", "MUG", "NET", "NEW", "NIL", "NIT", "NOB", "NOD", "NOR", "NOT", "NOW", "NUT", "OAK", "OAR", "OAT", "ODD", "ODE", "OFF", "OFT", "OIL", "OLD", "ONE", "OPT", "ORB", "ORE", "OUR", "OUT", "OWE", "OWL", "OWN", "PAD", "PAL", "PAN", "PAT", "PAW", "PAY", "PEA", "PEG", "PEN", "PEP", "PER", "PET", "PEW", "PIE", "PIG", "PIN", "PIT", "POD", "POP", "POT", "POW", "PRY", "PUB", "PUN", "PUP", "PUS", "PUT", "RAG", "RAN", "RAP", "RAT", "RAW", "RAY", "RED", "REP", "RIB", "RID", "RIG", "RIM", "RIP", "ROB", "ROD", "ROE", "ROT", "ROW", "RUB", "RUG", "RUN", "RUT", "RYE", "SAD", "SAP", "SAT", "SAW", "SAY", "SEA", "SET", "SEW", "SHE", "SHY", "SIN", "SIP", "SIR", "SIS", "SIT", "SIX", "SKI", "SKY", "SLY", "SOB", "SOD", "SON", "SPA", "SPY", "STY", "SUB", "SUM", "SUN", "TAB", "TAD", "TAG", "TAN", "TAP", "TAR", "TAX", "TEA", "TEN", "THE", "TIE", "TIN", "TIP", "TOE", "TON", "TOO", "TOP", "TOY", "TRY", "TUB", "TUG", "TWO", "URN", "USE", "VAN", "VAT", "VIA", "VIE", "WAD", "WAG", "WAR", "WAS", "WAX", "WAY", "WEB", "WED", "WEE", "WET", "WHO", "WHY", "WIG", "WIN", "WIT", "WOE", "WOK", "WON", "WOO", "YAM", "YAP", "YAW", "YEA", "YEN", "YES", "YET", "YEW", "YOU", "ZEN", "ZIG", "ZIP", "ZOO"],
  4: ["THAT", "WITH", "HAVE", "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "TIME", "VERY", "WHEN", "COME", "HERE", "JUST", "LIKE", "LONG", "MAKE", "MANY", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "WELL", "WORK", "YEAR", "ABLE", "ARCH", "BACK", "BALL", "BAND", "BANK", "BARE", "BARK", "BARN", "BASE", "BATH", "BEAM", "BEAN", "BEAR", "BEAT", "BELL", "BELT", "BEND", "BENT", "BEST", "BIAS", "BILE", "BIND", "BIRD", "BITE", "BLOW", "BLUE", "BOAR", "BOAT", "BODY", "BOLD", "BOLT", "BOMB", "BOND", "BONE", "BOOK", "BOOM", "BOOT", "BORN", "BOTH", "BOWL", "BULK", "BURN", "BURP", "BUSY", "CAGE", "CAKE", "CALL", "CALM", "CAME", "CAMP", "CANE", "CANT", "CAPE", "CARD", "CARE", "CARP", "CART", "CASE", "CASH", "CAST", "CAVE", "CELL", "CENT", "CHAP", "CHAR", "CHAT", "CHIP", "CHOP", "CITE", "CITY", "CLAP", "CLAY", "CLIP", "CLUB", "COAL", "COAT", "CODE", "COIL", "COIN", "COLT", "COMB", "CONE", "COOK", "COOL", "COPE", "COPY", "CORD", "CORE", "CORK", "CORN", "COST", "COUP", "COVE", "CRAB", "CREW", "CROP", "CROW", "CUBE", "CURB", "CURD", "CURL", "CURT", "CUTE", "DAMP", "DARE", "DARK", "DARN", "DART", "DATA", "DATE", "DAWN", "DEAD", "DEAF", "DEAL", "DEAN", "DEAR", "DECK", "DEEM", "DEEP", "DENT", "DENY", "DESK", "DIAL", "DICE", "DIED", "DIET", "DIME", "DINE", "DIRE", "DIRT", "DISC", "DISH", "DOCK", "DOLL", "DOME", "DONE", "DOOR", "DOSE", "DOTE", "DOWN", "DOZE", "DRAB", "DRAG", "DRAW", "DREW", "DRIP", "DROP", "DRUG", "DRUM", "DUAL", "DUEL", "DUKE", "DULL", "DUMB", "DUMP", "DUNE", "DUNK", "DUSK", "DUST", "DUTY", "EACH", "EARL", "EARN", "EASE", "EAST", "EASY", "ECHO", "EDDY", "EDGE", "EDIT", "EMIT", "EVIL", "EXAM", "EXIT", "FACE", "FACT", "FADE", "FAIL", "FAIR", "FAKE", "FALL", "FAME", "FANG", "FARE", "FARM", "FAST", "FATE", "FEAR", "FEAT", "FEED", "FEEL", "FEET", "FELL", "FELT", "FERN", "FILE", "FILL", "FILM", "FIND", "FINE", "FIRE", "FIRM", "FISH", "FIST", "FIVE", "FLAG", "FLAP", "FLAT", "FLAW", "FLEA", "FLED", "FLEE", "FLEW", "FLEX", "FLIP", "FLIT", "FLOW", "FOAM", "FOLD", "FOLK", "FOND", "FONT", "FOOD", "FOOL", "FOOT", "FORK", "FORM", "FORT", "FOUL", "FOUR", "FOWL", "FREE", "FRET", "FROM", "FUEL", "FULL", "GAIN", "GAIT", "GALE", "GALL", "GAME", "GANG", "GAPE", "GARB", "GATE", "GAVE", "GAZE", "GEAR", "GENE", "GLEN", "GLOW", "GLUE", "GLUM", "GNAT", "GOAL", "GOAT", "GOLD", "GOLF", "GONE", "GONG", "GOOD", "GOOF", "GORE", "GOWN", "GRAB", "GRAD", "GRAM", "GRAY", "GREW", "GREY", "GRID", "GRIM", "GRIN", "GRIP", "GRIT", "GROW", "GRUB", "GULF", "GUST", "HACK", "HAIL", "HAIR", "HALF", "HALL", "HALT", "HAND", "HANG", "HANK", "HARD", "HARE", "HARM", "HARP", "HASH", "HAUL", "HAVE", "HAWK", "HAZE", "HAZY", "HEAD", "HEAL", "HEAP", "HEAR", "HEAT", "HECK", "HEED", "HEEL", "HEIR", "HELD", "HELL", "HELM", "HELP", "HEMP", "HERB", "HERD", "HERE", "HERO", "HIDE", "HIGH", "HIKE", "HILL", "HILT", "HIND", "HINT", "HIRE", "HISS", "HIVE", "HOAX", "HOLD", "HOLE", "HOLY", "HOME", "HONE", "HOOD", "HOOF", "HOOK", "HOOP", "HOOT", "HOPE", "HORN", "HOSE", "HOST", "HOUR", "HOWL", "HUGE", "HULK", "HULL", "HUMP", "HUNG", "HUNK", "HUNT", "HURL", "HURT", "HUSH", "HUSK", "ICON", "IDEA", "IDLE", "INCH", "INTO", "IRON", "ISLE", "ITCH", "ITEM", "JACK", "JADE", "JAIL", "JAMS", "JARS", "JAWS", "JAYS", "JAZZ", "JEAN", "JEEP", "JEER", "JELL", "JEST", "JIBE", "JIFF", "JIVE", "JOIN", "JOKE", "JOLT", "JOSH", "JOWL", "JOYS", "JUDO", "JULY", "JUMP", "JUNE", "JUNK", "JURY", "JUST", "JUTE", "KALE", "KEEN", "KEEP", "KELP", "KEPT", "KICK", "KILL", "KILN", "KILT", "KIND", "KING", "KINK", "KISS", "KITE", "KNEE", "KNEW", "KNIT", "KNOB", "KNOT", "KNOW", "LACE", "LACK", "LADY", "LAID", "LAIR", "LAKE", "LAMB", "LAME", "LAMP", "LAND", "LANE", "LANK", "LARD", "LASH", "LASS", "LAST", "LATE", "LATH", "LAUD", "LAVA", "LAWN", "LAWS", "LAYS", "LAZY", "LEAD", "LEAF", "LEAK", "LEAN", "LEAP", "LEFT", "LEND", "LENS", "LENT", "LESS", "LEVY", "LIAR", "LICE", "LICK", "LIED", "LIEN", "LIES", "LIEU", "LIFE", "LIFT", "LIKE", "LILT", "LILY", "LIMB", "LIME", "LIMP", "LINE", "LING", "LINK", "LINT", "LION", "LIPS", "LISP", "LIST", "LIVE", "LOAD", "LOAF", "LOAM", "LOAN", "LOBE", "LOCK", "LOFT", "LONE", "LONG", "LOOK", "LOOM", "LOON", "LOOP", "LOOT", "LORE", "LOSE", "LOSS", "LOST", "LOUD", "LOUT", "LOVE", "LUCK", "LUMP", "LUNG", "LURE", "LURK", "LUSH", "LUST", "LUTE", "LYNX", "LYRE", "MACE", "MADE", "MAID", "MAIL", "MAIN", "MALE", "MALL", "MALT", "MANE", "MANY", "MAPS", "MARE", "MARK", "MARS", "MASH", "MASK", "MASS", "MAST", "MATE", "MATH", "MEAL", "MEAN", "MEAT", "MEEK", "MEET", "MELT", "MEMO", "MEND", "MENU", "MESH", "MESS", "MICE", "MILD", "MILE", "MILK", "MILL", "MIME", "MIND", "MINE", "MINT", "MISS", "MIST", "MITE", "MITT", "MOAN", "MOAT", "MOCK", "MODE", "MOLD", "MOLE", "MOLT", "MONK", "MOOD", "MOON", "MOOR", "MOOT", "MOPE", "MORE", "MOSS", "MOST", "MOTH", "MOVE", "MULE", "MULL", "MUSE", "MUSH", "MUST", "MUTE", "MYTH", "NAIL", "NAME", "NAPE", "NAVY", "NEAR", "NEAT", "NECK", "NEED", "NEON", "NEST", "NEWS", "NEWT", "NEXT", "NICE", "NINE", "NODE", "NOEL", "NONE", "NOOK", "NOON", "NOPE", "NORM", "NOSE", "NOTE", "NOUN", "NOVA", "NUMB", "OATH", "OBEY", "ODOR", "OMEN", "OMIT", "ONCE", "ONLY", "ONTO", "OPAL", "OPEN", "ORAL", "ORCA", "OVEN", "OVER", "PACE", "PACK", "PAGE", "PAID", "PAIL", "PAIN", "PAIR", "PALE", "PALL", "PALM", "PANE", "PANG", "PANT", "PARK", "PART", "PASS", "PAST", "PATH", "PAVE", "PAWN", "PEAK", "PEAL", "PEAR", "PEAT", "PECK", "PEEK", "PEEL", "PEER", "PELT", "PERK", "PEST", "PICK", "PIER", "PIKE", "PILE", "PILL", "PINE", "PINK", "PINT", "PIPE", "PITH", "PITY", "PLAN", "PLAY", "PLEA", "PLOD", "PLOP", "PLOT", "PLOW", "PLOY", "PLUG", "PLUM", "PLUS", "POKE", "POLE", "POLL", "POLO", "POND", "PONY", "POOL", "POOR", "POPE", "PORK", "PORT", "POSE", "POST", "POSY", "POUR", "PRAY", "PREP", "PREY", "PRIM", "PROW", "PULL", "PULP", "PUMP", "PUNK", "PUNT", "PUPA", "PURE", "PURL", "PURR", "PUSH", "QUIT", "QUIZ", "RACE", "RACK", "RAFT", "RAGE", "RAID", "RAIL", "RAIN", "RAKE", "RAMP", "RANG", "RANK", "RANT", "RARE", "RASH", "RASP", "RATE", "RAVE", "RAYS", "RAZE", "READ", "REAL", "REAM", "REAP", "REAR", "REED", "REEF", "REEK", "REEL", "RENT", "REST", "RICE", "RICH", "RIDE", "RIFE", "RIFT", "RIGHT", "RILE", "RING", "RINK", "RIOT", "RIPE", "RISE", "RISK", "RITE", "ROAD", "ROAM", "ROAR", "ROBE", "ROCK", "RODE", "ROLE", "ROLL", "ROMP", "ROOF", "ROOM", "ROOT", "ROPE", "ROSE", "ROSY", "ROTE", "ROUT", "ROVE", "RUBY", "RUDE", "RUED", "RUIN", "RULE", "RUNG", "RUNT", "RUSE", "RUSH", "RUST", "RUTH", "SACK", "SAFE", "SAGA", "SAGE", "SAID", "SAIL", "SAKE", "SALE", "SALT", "SAME", "SAND", "SANE", "SANG", "SANK", "SASH", "SAVE", "SCAB", "SCAR", "SEAL", "SEAM", "SEAT", "SECT", "SEED", "SEEK", "SEEM", "SEEN", "SELF", "SELL", "SEMI", "SEND", "SENT", "SERF", "SETS", "SEWN", "SHAD", "SHAM", "SHED", "SHIN", "SHIP", "SHOE", "SHOP", "SHOT", "SHOW", "SHUT", "SICK", "SIDE", "SIFT", "SIGH", "SIGN", "SILK", "SILL", "SILO", "SING", "SINK", "SITE", "SIZE", "SKID", "SKIM", "SKIN", "SKIP", "SLAB", "SLAG", "SLAM", "SLAP", "SLAT", "SLAW", "SLAY", "SLED", "SLEW", "SLID", "SLIM", "SLIP", "SLIT", "SLOB", "SLOP", "SLOT", "SLOW", "SLUM", "SMOG", "SNAP", "SOAK", "SOAR", "SOCK", "SODA", "SOFT", "SOIL", "SOLD", "SOLE", "SOLO", "SOME", "SONG", "SOON", "SOOT", "SORE", "SORT", "SOUL", "SOUP", "SOUR", "SPAN", "SPED", "SPIN", "SPIT", "SPOT", "STAB", "STAG", "STAR", "STAY", "STEM", "STEP", "STEW", "STIR", "STOP", "STUB", "STUD", "STUN", "SUCH", "SUIT", "SULK", "SUMP", "SUNG", "SUNK", "SURE", "SURF", "SWAB", "SWAM", "SWAP", "SWAT", "SWAY", "SWIM", "SWUM", "TACK", "TACT", "TAIL", "TAKE", "TALE", "TALK", "TALL", "TAME", "TANK", "TAPE", "TAPS", "TARN", "TARP", "TASK", "TAUT", "TAXI", "TEAM", "TEAR", "TEAS", "TEAT", "TEND", "TENS", "TENT", "TERM", "TEST", "TEXT", "THAN", "THAT", "THAW", "THEE", "THEM", "THEN", "THEY", "THIN", "THIS", "THOU", "THUD", "THUG", "THUS", "TICK", "TIDE", "TIDY", "TIED", "TIER", "TIES", "TIFF", "TILE", "TILL", "TILT", "TIME", "TINE", "TINT", "TINY", "TIRE", "TOAD", "TOES", "TOGS", "TOIL", "TOLD", "TOLL", "TOMB", "TOME", "TONE", "TOOK", "TOOL", "TOOT", "TOPS", "TORE", "TORN", "TORT", "TOSS", "TOUR", "TOUT", "TOWN", "TOYS", "TRAP", "TRAY", "TREE", "TREK", "TRIM", "TRIO", "TRIP", "TROD", "TROT", "TRUE", "TSAR", "TUBA", "TUBE", "TUBS", "TUCK", "TUFT", "TUGS", "TUNE", "TURF", "TURN", "TUSK", "TUTU", "TWIG", "TWIN", "TWIT", "TYPE", "UGLY", "UNIT", "UNTO", "UPON", "URGE", "USED", "VAIN", "VALE", "VANE", "VARY", "VASE", "VAST", "VEAL", "VEIL", "VEIN", "VEND", "VENT", "VERB", "VERY", "VEST", "VETO", "VIAL", "VICE", "VIEW", "VILE", "VINE", "VOID", "VOTE", "VOWS", "WADE", "WAGE", "WAIL", "WAIT", "WAKE", "WALK", "WALL", "WAND", "WANE", "WANT", "WARD", "WARE", "WARM", "WARN", "WARP", "WARS", "WART", "WARY", "WASH", "WASP", "WAVE", "WAXY", "WEAK", "WEAN", "WEAR", "WEEP", "WEIR", "WELD", "WELL", "WELT", "WENT", "WEPT", "WERE", "WEST", "WHAT", "WHEN", "WHET", "WHEY", "WHICH", "WHILE", "WHIM", "WHIP", "WHIR", "WHIT", "WHIZ", "WHOM", "WICK", "WIDE", "WIFE", "WIGS", "WILD", "WILL", "WILT", "WILY", "WIMP", "WIND", "WINE", "WING", "WINK", "WINS", "WIPE", "WIRE", "WIRY", "WISE", "WISH", "WISP", "WITH", "WOKE", "WOLF", "WOMB", "WOMEN", "WONDER", "WOOD", "WOOL", "WORD", "WORE", "WORK", "WORLD", "WORM", "WORN", "WORRY", "WORSE", "WORST", "WORTH", "WOULD", "WOUND", "WOVE", "WOVEN", "WRAP", "WRATH", "WRECK", "WREN", "WRING", "WRIST", "WRITE", "WRONG", "WROTE", "YACHT", "YANK", "YARD", "YARN", "YAWN", "YEAR", "YEAST", "YELL", "YIELD", "YOKE", "YOUNG", "YOUR", "YOUTH", "ZEAL", "ZERO", "ZEST", "ZINC", "ZONE"],
  5: ["ABOUT", "ABOVE", "ABUSE", "ACHED", "ACHES", "ACORN", "ACTED", "ACTOR", "ACUTE", "ADMIT", "ADOBE", "ADOPT", "ADORE", "ADORN", "ADULT", "AFTER", "AGAIN", "AGENT", "AGREE", "AHEAD", "AISLE", "ALARM", "ALBUM", "ALERT", "ALIAS", "ALIEN", "ALIGN", "ALIKE", "ALIVE", "ALLEY", "ALLOY", "ALLOW", "ALOFT", "ALONE", "ALONG", "ALOUD", "ALTAR", "ALTER", "ANGEL", "ANGER", "ANGLE", "ANGRY", "ANKLE", "ANNOY", "ANODE", "ANSWER", "ANTIC", "ANVIL", "APART", "APPLE", "APPLY", "APRON", "APTLY", "ARBOR", "ARDOR", "ARENA", "ARGUE", "ARISE", "ARMED", "ARMOR", "AROMA", "AROSE", "ARRAY", "ARROW", "ARSON", "ARTSY", "ASCOT", "ASHES", "ASIDE", "ASKED", "ASPEN", "ASSET", "ATLAS", "ATONE", "ATTIC", "AUDIO", "AUDIT", "AUGUR", "AUNTS", "AVAIL", "AVOID", "AWAKE", "AWARD", "AWARE", "AWFUL", "AWOKE", "AZURE", "BABEL", "BACON", "BADGE", "BADLY", "BAGEL", "BAKER", "BALDY", "BALED", "BALES", "BALKS", "BALLS", "BALMY", "BANAL", "BANDY", "BANDS", "BANES", "BANGS", "BANJO", "BANKS", "BANNS", "BARKS", "BARNS", "BARON", "BERRY", "BASIL", "BASIN", "BASIC", "BASTE", "BATCH", "BATED", "BATHE", "BATON", "BATTY", "BAULK", "BAWDY", "BAWLS", "BEACH", "BEADS", "BEAMS", "BEANS", "BEARD", "BEAST", "BEATS", "BEGUN", "BELLE", "BELLY", "BELOW", "BELTS", "BENCH", "BENDS", "BENDY", "BERRY", "BIRTH", "BISON", "BITES", "BITTER", "BLACK", "BLADE", "BLAME", "BLANK", "BLARE", "BLAST", "BLAZE", "BLEAK", "BLEAT", "BLEED", "BLEND", "BLESS", "BLIND", "BLINK", "BLISS", "BLITZ", "BLOAT", "BLOCK", "BLOKE", "BLOOD", "BLOOM", "BLOWN", "BLOWS", "BLUFF", "BLUNT", "BLURS", "BLURT", "BLUSH", "BOAST", "BOATS", "BOBBY", "BODES", "BOGGY", "BOILS", "BOLTS", "BOMBS", "BONDS", "BONED", "BONES", "BONUS", "BOOKS", "BOOST", "BOOTH", "BOOZE", "BORAX", "BORED", "BORER", "BOSSY", "BOTCH", "BOUGH", "BOUND", "BOUTS", "BOWER", "BOWLS", "BOXED", "BOXER", "BOXES", "BRACE", "BRAGS", "BRAID", "BRAIN", "BRAKE", "BRAND", "BRASS", "BRAWL", "BRAWN", "BRAYS", "BREAD", "BREAK", "BREED", "BREWS", "BRIDE", "BRIEF", "BRINE", "BRING", "BRINK", "BRISK", "BROAD", "BROKE", "BROOD", "BROOK", "BROOM", "BROTH", "BROWN", "BROWS", "BRUNT", "BRUSH", "BRUTE", "BUDDY", "BUDGE", "BUGGY", "BUILD", "BUILT", "BULGE", "BULKS", "BULKY", "BULLS", "BUMPS", "BUMPY", "BUNCH", "BUNKS", "BUNNY", "BUNTS", "BUOYS", "BURBS", "BURGS", "BURLY", "BURNS", "BURNT", "BURPS", "BURRO", "BURRS", "BUSTS", "BUSTY", "BUTTS", "BUYER", "BUZZY", "CABAL", "CABIN", "CABLE", "CACAO", "CACHE", "CADET", "CAFES", "CAGES", "CAGEY", "CAKED", "CAKES", "CALFS", "CALLS", "CALMS", "CALVE", "CAMEL", "CAMEO", "CAMPS", "CANAL", "CANDY", "CANED", "CANES", "CANOE", "CANON", "CAPER", "CAPES", "CARAT", "CARBS", "CARDS", "CARED", "CARER", "CARES", "CARGO", "CAROB", "CAROL", "CAROM", "CARPS", "CARRY", "CARTS", "CARVE", "CASES", "CASED", "CASKS", "CASTE", "CASTS", "CATCH", "CATER", "CAUSE", "CAVED", "CAVER", "CAVES", "CEASE", "CEDAR", "CEDED", "CEDES", "CELEB", "CELLS", "CELTS", "CHAFE", "CHAFF", "CHAIN", "CHAIR", "CHALK", "CHAMP", "CHANT", "CHAOS", "CHAPS", "CHARD", "CHARM", "CHARS", "CHART", "CHASE", "CHEAP", "CHEAT", "CHECK", "CHEEK", "CHEER", "CHESS", "CHEST", "CHICK", "CHIEF", "CHILD", "CHILL", "CHIMP", "CHINA", "CHINS", "CHIPS", "CHOIR", "CHOKE", "CHOMP", "CHOPS", "CHORD", "CHORE", "CHOSE", "CHOWS", "CHUBS", "CHUCK", "CHUFF", "CHUMS", "CHUNK", "CHURN", "CHUTE", "CIDER", "CIGAR", "CINCH", "CITED", "CITES", "CLAIM", "CLAMP", "CLAMS", "CLANG", "CLANK", "CLAPS", "CLASH", "CLASS", "CLAWS", "CLAYS", "CLEAN", "CLEAR", "CLEAT", "CLEFT", "CLERK", "CLICK", "CLIFF", "CLIMB", "CLING", "CLOAK", "CLOCK", "CLODS", "CLOGS", "CLONE", "CLOSE", "CLOTH", "CLOUD", "CLOUT", "CLOVE", "CLOWN", "CLUBS", "CLUCK", "CLUED", "CLUES", "CLUMP", "CLUNG", "CLUNK", "COACH", "COALS", "COAST", "COATS", "COBRA", "COCKS", "COCKY", "COCOA", "CODED", "CODER", "CODES", "COIFS", "COILS", "COINS", "COKED", "COKES", "COLDS", "COLON", "COLOR", "COMET", "COMFY", "COMMA", "COOPS", "CORAL", "CORDS", "CORED", "CORES", "CORGI", "CORKS", "CORKY", "CORNS", "CORNY", "CORPS", "COUCH", "COUGH", "COULD", "COUNT", "COUPE", "COURT", "COUTH", "COVES", "COVET", "COWED", "COWER", "COYPU", "CRABS", "CRACK", "CRAFT", "CRAGS", "CRAMP", "CRANE", "CRANK", "CRAPE", "CRAPS", "CRASH", "CRASS", "CRATE", "CRAVE", "CRAWL", "CRAZE", "CRAZY", "CREAK", "CREAM", "CREED", "CREEK", "CREEP", "CREPT", "CRESS", "CREST", "CREWS", "CRIBS", "CRICK", "CRIED", "CRIER", "CRIES", "CRIME", "CRIMP", "CROAK", "CROCK", "CROCUS", "CROFT", "CRONE", "CRONY", "CROOK", "CROON", "CROPS", "CROSS", "CROUP", "CROWS", "CRUDE", "CRUEL", "CRUISE", "CRUMB", "CRUSH", "CRUST", "CRYPT", "CUBED", "CUBES", "CUBIC", "CUBIT", "CUFFS", "CULLS", "CUPID", "CURBS", "CURDS", "CURLS", "CURLY", "CURRY", "CURSE", "CURVE", "CUSHY", "CUSPS", "CUTIE", "CYBER", "CYCLE", "CYNIC", "CYSTS", "DADDY", "DAILY", "DAISY", "DALES", "DALLY", "DAMES", "DAMPS", "DANCE", "DANDY", "DARED", "DARES", "DARKS", "DARTS", "DATED", "DATES", "DATUM", "DAUBS", "DAUNT", "DAWNS", "DAZED", "DEALS", "DEALT", "DEANS", "DEATH", "DEBIT", "DEBTS", "DEBUG", "DEBUT", "DECAF", "DECAY", "DECAL", "DECOR", "DECOY", "DECREE", "DECRY", "DEEDS", "DEEMS", "DEEPLY", "DEEPS", "DEETS", "DEFACE", "DEFAULT", "DEFEAT", "DEFECT", "DEFEND", "DEFER", "DEFERS", "DEFIED", "DEFIES", "DEFINE", "DEFRAUD", "DEFY", "DEGRADE", "DEGREE", "DEICED", "DEIFY", "DEIGN", "DEITY", "DEJECT", "DELAY", "DELATE", "DELETE", "DELI", "DELIGHT", "DELIVER", "DELTA", "DELUDE", "DELUGE", "DELVE", "DEMAND", "DEMEAN", "DEMISE", "DEMO", "DEMOTE", "DEMUR", "DENIAL", "DENIER", "DENIES", "DENOTE", "DENSE", "DENSER", "DENTS", "DENUDE", "DENY", "DEPART", "DEPEND", "DEPICT", "DEPLETE", "DEPLORE", "DEPLOY", "DEPORT", "DEPOSE", "DEPOSIT", "DEPRESS", "DEPRIVE", "DEPTH", "DEPUTY", "DERAIL", "DERANGE", "DERIDE", "DERIVE", "DESCEND", "DESCRIBE", "DESERT", "DESERVE", "DESIGN", "DESIRE", "DESK", "DESOLATE", "DESPAIR", "DESPISE", "DESPITE", "DESSERT", "DESTROY", "DETACH", "DETAIL", "DETAIN", "DETECT", "DETER", "DETEST", "DETHRONE", "DETONATE", "DETOUR", "DETRACT", "DEUCE", "DEVALUE", "DEVAST", "DEVELOP", "DEVIATE", "DEVICE", "DEVIL", "DEVISE", "DEVOID", "DEVOLVE", "DEVOTE", "DEVOUR", "DEVOUT", "DEWS", "DEWY", "DEXTR", "DEXTROSE", "DHOW", "DIABLO", "DIACE", "DIACID", "DIADEM", "DIAERESIS", "DIALS", "DIAMETER", "DIAMOND", "DIAPER", "DIARRHEA", "DIARY", "DIASTASE", "DIASTEMA", "DIASTOLE", "DIATRIBE", "DIAZEPAM", "DIAZINE", "DIAZOMETHANE", "DIBASIC", "DIBBER", "DIBBLE", "DICE", "DICENTRIC", "DICHOGAMY", "DICHOTOMY", "DICHOTIC", "DICHROMATE", "DICHROMIC", "DICHROMOUS", "DICIER", "DICKER", "DICKEY", "DICKSONIA", "DICKY", "DICLINY", "DICOUMARIN", "DICRANIA", "DICRANIDIUM", "DICRANOID", "DICRANULA"],
  6: ["ABROAD", "ABSENT", "ABSORB", "ABSTAIN", "ABUSED", "ACCENT", "ACCEPT", "ACCESS", "ACCRUE", "ACCUSE", "ACHING", "ACIDIC", "ACQUIRE", "ACTING", "ACTION", "ACTIVE", "ACTUAL", "ACUITY", "ACUMEN", "ADDEND", "ADDICT", "ADDING", "ADDLES", "ADDUCT", "ADJOIN", "ADMIRE", "ADORER", "ADORN", "ADVERSE", "ADVICE", "ADVISE", "AFFAIR", "AFFECT", "AFFORD", "AFRAID", "AFRICA", "AFTERS", "AGENDA", "AGREED", "AIDING", "ALBEIT", "ALBERT", "ALBUM", "ALIGHT", "ALIGNS", "ALKALI", "ALLOWS", "ALMOST", "ALMOND", "ALOOF", "ALONG", "AMOUNT", "AMPLE", "AMUSEMENT", "AMUSED", "ANALOG", "ANCHOR", "ANCIENT", "ANDEAN", "ANEMIA", "ANEMONE", "ANEW", "ANGELS", "ANGERS", "ANGLES", "ANGLED", "ANGLO", "ANGRY", "ANIMAL", "ANKLE", "ANNALS", "ANNEX", "ANNOYS", "ANNUAL", "ANNULS", "ANODE", "ANOMALY", "ANON", "ANOTHER", "ANSWER", "ANTACID", "ANTAPEX", "ANTEARS", "ANTHEM", "ANTHER", "ANTHILL", "ANTHOID", "ANTHRAX", "ANTICAL", "ANTICID", "ANTIDOT", "ANTIGEN", "ANTIKER", "ANTIKID", "ANTILED", "ANTIMAN", "ANTIMEN", "ANTIMIX", "ANTINOM", "ANTIPOD", "ANTIQUE", "ANTIREP", "ANTIRIB", "ANTISEX", "ANTITAX", "ANTITED", "ANTITIP", "ANTITOD", "ANTITOY", "ANTIWAR", "ANTLERS", "ANTLIKE", "ANTONYM", "ANTRUMS", "ANXIETY", "ANXIOUS", "ANYBODY", "ANYMORE", "ANYTIME", "ANYWAY", "ANYWHERE", "APARATE", "APATHY", "APLENTY", "APOCODE", "APODEME", "APOETIC", "APOGEAL", "APOGEAN", "APOGEON", "APOGEUM", "APOLLOS", "APOLOGY", "APONOSE", "APOPHIA", "APOSEME", "APOSIL", "APOSTIL", "APOSTLE", "APOSTAT", "APOSTE", "APOSTOL"],
  7: ["ABANDON", "ABILITY", "ABSENCE", "ABSTAIN", "ACADEMY", "ACCLAIM", "ACCOUNT", "ACCUSED", "ACHIEVE", "ACRONYM", "ACTUATE", "ADDRESS", "ADJOURN", "ADJUNCT", "ADVANCE", "ADVERSE", "ADVISED", "ADVISER", "AERIALS", "AFFAIRS", "AFFLICT", "AFFORDS", "AGAINST", "AGGRESS", "AGONIZE", "AGREED", "ALCOHOL", "ALGEBRA", "ALIGNED", "ALKALAI", "ALLEGED", "ALLUDE", "ALLYING", "ALMANAC", "ALTERED", "AMATEUR", "AMBIENT", "AMENDED", "AMONGST", "AMPLIFY", "AMUSED", "ANATOMY", "ANCIENT", "ANDIRON", "ANECDOTE", "ANEMIA", "ANEMONE", "ANGELS", "ANGLING", "ANGULAR", "ANIMATE", "ANNALEN", "ANNEAL", "ANNOYED", "ANNUALS", "ANODIZE", "ANOTHER", "ANSWERS", "ANTACID", "ANTAPEX", "ANTEARS", "ANTHEMS", "ANTHERI", "ANTHILL", "ANTHOID", "ANTHRAX", "ANTICAL", "ANTICID", "ANTIDOT", "ANTIGEN", "ANTIKER", "ANTIKID", "ANTILED", "ANTIMAN", "ANTIMEN", "ANTIMIX", "ANTINOM", "ANTIPOD", "ANTIQUE", "ANTIREP", "ANTIRIB", "ANTISEX", "ANTITAX", "ANTITIP", "ANTITOD", "ANTITOY", "ANTIWAR", "ANTLERS", "ANTLIKE", "ANTONYM", "ANTRUMS", "ANXIETY", "ANXIOUS", "ANYBODY", "ANYMORE", "ANYTIME", "ANYWAY", "ANYWHERE", "APARATE", "APATHY", "APLENTY", "APOCODE", "APODEME", "APOETIC", "APOGEAL", "APOGEAN", "APOGEON", "APOGEUM", "APOLLOS", "APOLOGY", "APONOSE", "APOPHIA", "APOSEME", "APOSIL", "APOSTIL", "APOSTLE", "APOSTAT", "APOSTE"],
  8: ["ABSOLUTE", "ABSTRACT", "ABUNDANT", "ACADEMIC", "ACCELERATE", "ACCEPTED", "ACCESSED", "ACCIDENT", "ACCOMPANY", "ACCURATE", "ACHIEVED", "ACQUIRED", "ACTUATED", "ADJUSTED", "ADMITTED", "ADOPTEES", "ADOPTION", "ADORABLE", "ADORNING", "ADVANCED", "AFFECTED", "AFFIRMED", "AFFORDED", "AFRICANS", "AGREEING", "AGENCIES", "AIRBORNE", "AIRPLANE", "AIRPORTS", "AIRSCREW", "AIRTIGHT", "AKINESIA", "AKINESIS", "AKINETIC", "ALACRITY", "ALARMING", "ALERTING", "ALFALFAS", "ALGEBRAS", "ALIGNMENT", "ALKALIES", "ALKALINE", "ALLERGEN", "ALLERGIC", "ALLEYWAY", "ALLIANCE", "ALLOCATE", "ALLOGAMY", "ALLOGENE", "ALLOGRAFT", "ALLOMERE", "ALLONYMIC", "ALLOPATH", "ALLOPATHY", "ALLOPETALOUS", "ALLOSAURUS", "ALLOPURINOL", "ALLOSOME", "ALLOSTATIC", "ALLOSTERIC", "ALLOTMENT", "ALLOTTER", "ALLOTTING", "ALLOVER", "ALLOWABLE", "ALLOWABLY", "ALLOWANCE", "ALLOWEDLY", "ALLOWER", "ALLOWING", "ALLOXAN", "ALLOYED", "ALLOYS"],
};

function buildWordList(topicWords) {
  const wordsByLength = {};
  for (let len = 3; len <= 8; len++) {
    wordsByLength[len] = [];
  }

  // Add topic words first (prioritized)
  if (topicWords && Array.isArray(topicWords)) {
    for (const word of topicWords) {
      const w = String(word).toUpperCase();
      const len = w.length;
      if (len >= 3 && len <= 8 && !wordsByLength[len].includes(w)) {
        wordsByLength[len].unshift(w);
      }
    }
  }

  // Add filler words
  for (let len = 3; len <= 8; len++) {
    for (const word of BASE_FILLER[len]) {
      if (!wordsByLength[len].includes(word)) {
        wordsByLength[len].push(word);
      }
    }
  }

  return wordsByLength;
}

function greedyFill(pattern, slots, wordsByLength, attempt = 0) {
  const t0 = Date.now();
  const grid = {};
  const assignment = {};
  const used = new Set();

  // Initialize grid
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === ".") {
        grid[`${r},${c}`] = null;
      }
    }
  }

  // Randomize slot order for each attempt
  const slotOrder = Array.from({ length: slots.length }, (_, i) => i);
  if (attempt > 0) {
    for (let i = slotOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slotOrder[i], slotOrder[j]] = [slotOrder[j], slotOrder[i]];
    }
  }

  // Greedy fill: for each slot, pick first matching word
  for (const si of slotOrder) {
    const slot = slots[si];
    const len = slot.length;
    const words = wordsByLength[len] || [];

    let placed = false;
    for (const word of words) {
      if (used.has(word)) continue;

      let matches = true;
      for (let i = 0; i < len; i++) {
        const [r, c] = slot[i];
        const ch = grid[`${r},${c}`];
        if (ch !== null && ch !== word[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        // Place word
        for (let i = 0; i < len; i++) {
          const [r, c] = slot[i];
          grid[`${r},${c}`] = word[i];
        }
        used.add(word);
        assignment[si] = word;
        placed = true;
        break;
      }
    }

    if (!placed) return null; // Dead end, restart
  }

  const fillTime = (Date.now() - t0) / 1000;
  if (Object.keys(assignment).length < slots.length) {
    return null; // Incomplete fill
  }

  // Extract answers
  const across = [], down = [];
  let num = 1;
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === ".") continue;
      const hasAcross = c === 0 || pattern[r][c - 1] === ".";
      const hasDown = r === 0 || pattern[r - 1]?.[c] === ".";
      if (hasAcross || hasDown) {
        if (hasAcross) {
          let ans = "";
          for (let cc = c; cc < pattern[r].length && pattern[r][cc] !== "."; cc++) {
            ans += grid[`${r},${cc}`];
          }
          across.push({ num, dir: "A", answer: ans });
        }
        if (hasDown) {
          let ans = "";
          for (let rr = r; rr < pattern.length && pattern[rr][c] !== "."; rr++) {
            ans += grid[`${rr},${c}`];
          }
          down.push({ num, dir: "D", answer: ans });
        }
        num++;
      }
    }
  }

  return { success: true, pattern, across, down, fillTime };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });
  const { pattern, slots, topicWords = [], seed = 0 } = req.body;
  if (!pattern || !slots) return res.status(400).json({ error: "Missing data" });

  try {
    const wordsByLength = buildWordList(topicWords);

    // Random-restart greedy: try up to 20 times with different slot orders
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = greedyFill(pattern, slots, wordsByLength, attempt);
      if (result && result.success) {
        return res.status(200).json(result);
      }
    }

    return res.status(400).json({ error: "Could not fill grid after 20 attempts" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
