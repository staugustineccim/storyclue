// Load comprehensive word list from static assets
let WORDLIST_CACHE = null;

async function loadWordlist() {
  if (WORDLIST_CACHE) return WORDLIST_CACHE;

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/wordlist.json`);
    if (!res.ok) throw new Error(`Failed to load wordlist: ${res.status}`);
    WORDLIST_CACHE = await res.json();
    return WORDLIST_CACHE;
  } catch (e) {
    console.error("[grid-builder] Failed to load wordlist:", e.message);
    // Fallback: minimal word list if fetch fails
    return {
      "3": ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO", "BOY", "DID", "ITS", "LET", "MAY", "SAY", "SHE", "TOO", "USE"],
      "4": ["THAT", "WITH", "HAVE", "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "TIME", "VERY", "WHEN", "COME", "HERE", "JUST", "LIKE", "LONG", "MAKE", "MANY", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "WELL", "WORK", "YEAR", "ABLE", "BACK", "BALL", "BAND", "BASE", "BATH", "BEAT", "BELL", "BIRD", "BLOW", "BLUE", "BOAT", "BODY", "BOOK", "BOTH", "BOWL", "CAGE", "CAKE", "CALL", "CAME", "CAMP", "CARD", "CART", "CASE", "CAST", "CENT", "CITY", "COAT", "COLD", "COME", "COOL", "COPY", "COST", "DARK", "DATE", "DEAD", "DEAL", "DEEP", "DESK", "DIAL", "DIED", "DIME", "DONE", "DOOR", "DOWN", "DRAB", "DRAW", "DROP", "DRUG", "DUAL", "DULL", "DUMP", "EACH", "EARL", "EASY", "EDGE", "EMIT", "EVIL", "EXAM", "EXIT", "FACE", "FACT", "FADE", "FAIL", "FALL", "FARM", "FAST", "FEAR", "FEEL", "FEET", "FILE", "FILL", "FILM", "FIND", "FINE", "FIRE", "FIRM", "FISH", "FIVE", "FLAG", "FLAT", "FLED", "FLEE", "FLEW", "FLIP", "FLOW", "FOAM", "FOLD", "FOLK", "FOOD", "FOOT", "FORK", "FORM", "FORT", "FOUL", "FOUR", "FREE", "FROM", "FUEL", "FULL", "GAIN", "GAME", "GAVE", "GEAR", "GIFT", "GIRL", "GIVE", "GLAD", "GOAL", "GOAT", "GOES", "GOLD", "GOLF", "GONE", "GOOD", "GRAY", "GREW", "GRID", "GRIM", "GRIP", "GROW", "GULF", "HACK", "HAIL", "HAIR", "HALF", "HALL", "HAND", "HANG", "HARD", "HARM", "HATE", "HAVE", "HAWK", "HEAD", "HEAR", "HEAT", "HEEL", "HELD", "HELL", "HELP", "HERE", "HERO", "HIDE", "HIGH", "HILL", "HIND", "HINT", "HIRE", "HOLD", "HOLE", "HOLY", "HOME", "HOOD", "HOPE", "HORN", "HOSE", "HOST", "HOUR", "HUGE", "HUNG", "HUNT", "HURT", "ICON", "IDEA", "INCH", "INTO", "IRON", "ISLE", "ITEM", "JACK", "JAIL", "JAZZ", "JEAN", "JEEP", "JEST", "JOIN", "JOKE", "JOLT", "JULY", "JUMP", "JUNE", "JUST", "KALE", "KEEN", "KEEP", "KEPT", "KICK", "KILL", "KIND", "KING", "KISS", "KITE", "KNEE", "KNEW", "KNIT", "KNOB", "KNOW", "LACE", "LACK", "LADY", "LAID", "LAKE", "LAMB", "LAME", "LAMP", "LAND", "LARD", "LASH", "LAST", "LATE", "LAWN", "LEAD", "LEAF", "LEAK", "LEAN", "LEAP", "LEFT", "LEND", "LENS", "LEFT", "LESS", "LIAR", "LIED", "LIES", "LIFE", "LIFT", "LIKE", "LILY", "LIMB", "LIME", "LIMP", "LINE", "LINK", "LION", "LIST", "LIVE", "LOAD", "LOAF", "LOAN", "LOCK", "LOFT", "LONE", "LONG", "LOOK", "LOOM", "LOOP", "LOSE", "LOSS", "LOST", "LOUD", "LOVE", "LUCK", "LUMP", "LUNG", "LURE", "LUSH", "MADE", "MAID", "MAIL", "MAIN", "MAKE", "MALE", "MALL", "MANY", "MARK", "MARS", "MASK", "MASS", "MAST", "MATE", "MAZE", "MEAL", "MEAN", "MEAT", "MEET", "MELT", "MEMO", "MEND", "MENU", "MESS", "MICE", "MILD", "MILE", "MILK", "MILL", "MIME", "MIND", "MINE", "MISS", "MIST", "MODE", "MOLD", "MOLE", "MONK", "MOOD", "MOON", "MOOR", "MORE", "MOSS", "MOST", "MOTH", "MOVE", "MUCH", "MULE", "MUST", "MYTH", "NAIL", "NAME", "NAVY", "NEAR", "NEAT", "NECK", "NEED", "NEST", "NEXT", "NICE", "NONE", "NOON", "NOSE", "NOTE", "NOUN", "OVAL", "OVEN", "OVER", "PACE", "PAGE", "PAID", "PAIL", "PAIN", "PAIR", "PALE", "PALM", "PANE", "PARK", "PART", "PASS", "PAST", "PATH", "PAVE", "PEAK", "PEAL", "PEAR", "PEAS", "PECK", "PEEK", "PEEL", "PEER", "PEST", "PICK", "PIER", "PILE", "PILL", "PINE", "PINK", "PINT", "PIPE", "PLAN", "PLAY", "PLEA", "PLOT", "PLOW", "PLUM", "PLUS", "POEM", "POET", "POLE", "POLL", "POND", "PONY", "POOL", "POOR", "POPE", "PORK", "PORT", "POSE", "POST", "POUR", "PRAY", "PULL", "PULP", "PUMP", "QUIT", "QUIZ", "RACE", "RACK", "RAID", "RAIL", "RAIN", "RAKE", "RAMP", "RANK", "RARE", "RATE", "RAYS", "READ", "REAL", "REAM", "REAR", "REED", "REEL", "RENT", "REST", "RICE", "RICH", "RIDE", "RIFE", "RING", "RISE", "ROAD", "ROAM", "ROBE", "ROCK", "RODE", "ROLE", "ROLL", "ROOF", "ROOM", "ROOT", "ROPE", "ROSE", "RUDE", "RUIN", "RULE", "RUNG", "RUSE", "RUSH", "RUST", "SACK", "SAFE", "SAGA", "SAGE", "SAID", "SAIL", "SAKE", "SALE", "SALT", "SAME", "SAND", "SANG", "SANK", "SASH", "SAVE", "SEAL", "SEAM", "SEAT", "SEED", "SEEK", "SEEM", "SEEN", "SELF", "SELL", "SEMI", "SEND", "SENT", "SHED", "SHIP", "SHOE", "SHOP", "SHOT", "SHOW", "SICK", "SIDE", "SIGN", "SILK", "SILL", "SING", "SINK", "SIZE", "SKIP", "SLAM", "SLAP", "SLED", "SLID", "SLIM", "SLIP", "SLOW", "SNAP", "SOAP", "SOAR", "SOCK", "SODA", "SOFT", "SOIL", "SOLD", "SOLE", "SOLO", "SOME", "SONG", "SOON", "SORE", "SORT", "SOUL", "SOUP", "SOUR", "SPAN", "SPIN", "SPIT", "SPOT", "STAB", "STAR", "STAY", "STEM", "STEP", "STEW", "STIR", "STOP", "STUB", "STUD", "SUCH", "SUIT", "SUNK", "SURE", "SWIM", "TACK", "TAIL", "TAKE", "TALE", "TALK", "TALL", "TANK", "TAPE", "TASK", "TAXI", "TEAM", "TEAR", "TEAS", "TEEN", "TELL", "TEND", "TENS", "TENT", "TERM", "TEST", "TEXT", "THAN", "THAT", "THEE", "THEM", "THEN", "THEY", "THIN", "THIS", "THOU", "TIDE", "TIED", "TIER", "TILE", "TILL", "TILT", "TIME", "TOAD", "TOES", "TOLD", "TOLL", "TOME", "TONE", "TOOK", "TOOL", "TORE", "TORN", "TORT", "TOSS", "TOUR", "TOWN", "TRAP", "TRAY", "TREE", "TREK", "TRIM", "TRIO", "TRIP", "TRUE", "TUBA", "TUBE", "TUCK", "TUFT", "TUNE", "TURF", "TURN", "TWIN", "TYPE", "UNIT", "UPON", "USED", "VAIN", "VALE", "VANE", "VARY", "VASE", "VAST", "VEAL", "VEIL", "VEIN", "VENT", "VERB", "VERY", "VEST", "VETO", "VICE", "VIEW", "VILE", "VINE", "VISA", "VOID", "VOTE", "WAGE", "WAIL", "WAIT", "WAKE", "WALK", "WALL", "WANT", "WARD", "WARM", "WARN", "WARP", "WASH", "WAVE", "WEAK", "WEAR", "WEEP", "WELL", "WENT", "WERE", "WEST", "WHAT", "WHEN", "WHET", "WHICH", "WHILE", "WHIP", "WIDE", "WIFE", "WILD", "WILL", "WIND", "WINE", "WING", "WINK", "WISE", "WISH", "WITCH", "WITH", "WOKE", "WOLF", "WOMB", "WOOD", "WOOL", "WORD", "WORE", "WORK", "WORM", "WORN", "WRAP", "WREN", "WRIT", "YARD", "YARN", "YAWN", "YEAR", "YELL", "YOGA", "YOUR", "ZERO", "ZEST", "ZONE"],
      "5": ["ABOUT", "ABOVE", "ABUSE", "ACTED", "ACTOR", "ACUTE", "ADAPT", "ADMIT", "ADOPT", "ADORE", "ADULT", "AFTER", "AGAIN", "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIEN", "ALIGN", "ALIKE", "ALIVE", "ALLOW", "ALONE", "ALONG", "ALTER", "ANGEL", "ANGER", "ANGLE", "ANGRY", "ANKLE", "ANNOY", "APART", "APPLE", "APPLY", "ARENA", "ARGUE", "ARISE", "ARMED", "ARMOR", "AROMA", "ARRAY", "ARROW", "ASIDE", "ASSET", "ATLAS", "AUDIO", "AVOID", "AWAKE", "AWARD", "AWARE", "BASIC", "BEACH", "BEAST", "BEGAN", "BEING", "BELOW", "BENCH", "BERRY", "BIRTH", "BLACK", "BLADE", "BLAME", "BLANK", "BLAZE", "BLEED", "BLEND", "BLESS", "BLIND", "BLISS", "BLOCK", "BLOOD", "BLOOM", "BOARD", "BOOST", "BOOTH", "BOUND", "BRAIN", "BRAND", "BRAVE", "BREAD", "BREAK", "BREED", "BRICK", "BRIEF", "BRING", "BRINK", "BRISK", "BROAD", "BROKE", "BROOK", "BROOM", "BROWN", "BUILD", "BURST", "BUYER", "CABLE", "CALIF", "CAMEL", "CANAL", "CANDY", "CANON", "CARGO", "CAROL", "CARRY", "CARVE", "CATCH", "CAUSE", "CEASE", "CEDAR", "CHAIN", "CHAIR", "CHALK", "CHAMP", "CHANT", "CHAOS", "CHARM", "CHART", "CHASE", "CHEAP", "CHEAT", "CHECK", "CHEEK", "CHEER", "CHESS", "CHEST", "CHICK", "CHIEF", "CHILD", "CHILL", "CHINA", "CHOSE", "CHUNK", "CIVIC", "CIVIL", "CLAIM", "CLAMP", "CLASH", "CLASS", "CLEAN", "CLEAR", "CLERK", "CLICK", "CLIFF", "CLIMB", "CLING", "CLOCK", "CLONE", "CLOSE", "CLOTH", "CLOUD", "COACH", "COAST", "COBRA", "COCOA", "CORAL", "COUCH", "COUGH", "COULD", "COUNT", "COURT", "COVER", "CRACK", "CRAFT", "CRASH", "CRATE", "CRAVE", "CRAWL", "CRAZE", "CREAM", "CREED", "CREEK", "CREEP", "CRIME", "CRISP", "CROSS", "CROWD", "CROWN", "CRUDE", "CRUEL", "CRUSH", "CURVE", "CYCLE", "DAILY", "DANCE", "DATED", "DEALT", "DEATH", "DELAY", "DELTA", "DENSE", "DEPTH", "DERBY", "DETER", "DIARY", "DIRTY", "DIVER", "DIZZY", "DODGE", "DOING", "DOUBT", "DOUGH", "DRAFT", "DRAIN", "DRAMA", "DRANK", "DRAWN", "DREAM", "DRESS", "DRIED", "DRILL", "DRINK", "DRIVE", "DROWN", "DRUGS", "DRUNK", "EAGER", "EARLY", "EARTH", "EIGHT", "ELBOW", "ELDER", "ELITE", "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR", "ESSAY", "EVENT", "EVERY", "EXACT", "EXIST", "EXTRA", "FACED", "FACET", "FAITH", "FALSE", "FANCY", "FATAL", "FAULT", "FIBER", "FIELD", "FIERY", "FIFTH", "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED", "FLASH", "FLASK", "FLESH", "FLICK", "FLING", "FLINT", "FLOAT", "FLOCK", "FLOOD", "FLOOR", "FLORA", "FLOUR", "FLOWN", "FLUID", "FLUTE", "FOCAL", "FOCUS", "FOGGY", "FOLLY", "FORCE", "FORGE", "FORGE", "FORTH", "FORTY", "FORUM", "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRIED", "FRILL", "FRISK", "FRONT", "FROST", "FRUIT", "FULLY", "FUNNY", "FURRY", "FUZZY", "GAILY", "GAINS", "GALES", "GAMMA", "GAMES", "GANGS", "GATES", "GAUGE", "GAVEL", "GAZED", "GAZER", "GEARS", "GENIC", "GENRE", "GHOST", "GIANT", "GIDDY", "GIFTS", "GIGGLE", "GLAND", "GLARE", "GLASS", "GLAZE", "GLEAM", "GLEAN", "GLIDE", "GLOBE", "GLOOM", "GLORY", "GLOSS", "GLOVE", "GNOME", "GOALS", "GOATS", "GODLY", "GOING", "GONER", "GOOSE", "GORGE", "GORSE", "GRACE", "GRADE", "GRAFT", "GRAIN", "GRAND", "GRANT", "GRAPE", "GRAPH", "GRASP", "GRASS", "GRATE", "GRAVE", "GRAVY", "GRAZE", "GREAT", "GREED", "GREEN", "GREET", "GRIEF", "GRILL", "GRIME", "GRIND", "GROAN", "GROOM", "GROSS", "GROUP", "GROVE", "GROW", "GRUEL", "GUARD", "GUESS", "GUEST", "GUIDE", "GUILD", "GUILT", "GUISE", "GULCH", "GULLY", "GUMMY", "GUSTY", "HABIT", "HAIRY", "HALAL", "HALVE", "HANDS", "HANDY", "HANGS", "HAPPY", "HARDY", "HAREM", "HARM", "HARRY", "HASTE", "HASTY", "HATCH", "HAUNT", "HAVEN", "HAVOC", "HAWKS", "HAYED", "HAZED", "HAZEL", "HEADS", "HEADY", "HEALS", "HEAPS", "HEARD", "HEART", "HEAT", "HEATS", "HEAVE", "HEAVY", "HEDGE", "HEELS", "HEFTY", "HEIRS", "HELIX", "HELLO", "HELPS", "HENCE", "HENNA", "HERBS", "HERDS", "HERON", "HEXED", "HIDES", "HIGHS", "HIKED", "HIKER", "HILLS", "HILLY", "HINDS", "HINTS", "HIPPO", "HIRES", "HITCH", "HIVES", "HOADS", "HOARD", "HOBBY", "HOIST", "HOLDS", "HOLES", "HOLLY", "HOMER", "HOMES", "HONED", "HONES", "HONEY", "HONOR", "HOODS", "HOOFS", "HOOKS", "HOOPS", "HOOTS", "HOPED", "HOPES", "HORNS", "HORNY", "HORSE", "HOSES", "HOSTS", "HOTLY", "HOUND", "HOURS", "HOUSE", "HOVEL", "HOVER", "HOWDY", "HOWLS", "HUBBY", "HUFFS", "HUFFY", "HULKS", "HULLS", "HUMAN", "HUMID", "HUMOR", "HUMPS", "HUMUS", "BUNCH", "HUNKS", "HUNTS", "HURLS", "HURRY", "HURTS", "HUSKY", "HUSSY", "HUTCH", "HYDRA", "HYPED", "HYPER", "HYPES", "IDEAL", "IDEAS", "IDIOM", "IDIOT", "IDLED", "IDLES", "IDYLL", "IGLOO", "ILEUM", "IMAGE", "IMBUE", "IMPLY", "INANE", "INAPT", "INAUG", "INCHED", "INCUR", "INDEBT", "INDENS", "INDEX", "INDIA", "INDIGO", "INANE", "INERT", "INFAMY", "INFECT", "INFER", "INFIRMARY", "INGULF", "INHERE", "INHUME", "INJECT", "INJURE", "INJURY", "INJUSTICE", "INLACE", "INLACE", "INLAND", "INLAID", "INLETS", "INLETS", "INLETS", "INLETS", "INLETS", "INMALE", "INMALE", "INMATED", "INMATES", "INNATE", "INNATE", "INNER", "INNERLY", "INNERMOSTS", "INNERLY", "INNERS", "INNERVATE", "INNESS", "INNOCENCE", "INNOCENT", "INNOXIOUS", "INNOVATE", "INNUENDO", "INNUENDOES", "INODOROUS", "INODOROUS", "INODOROUS", "INOCULABLE", "INOCULABLE", "INOCULATE", "INOCULATORS", "INODES", "INODOROUS", "INOFTENENCY", "INOFFENSIVE", "INOFFENSIVE", "INOFFENSIVELY", "INOFFENSIVELY", "INOFFENSIVENESS", "INOFFENSIVENESS", "INOFFICIOSITY", "INOFFICIOUS", "INOFFICIOUS", "INOFFICIOUSNESS", "INOFFICIOUSNESS", "IODIN", "IODINE", "IODISED", "IODISED", "IODISM", "IODISM", "IODIZE", "IODIZED", "IODIZES", "IODIZING", "IODIZING", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS", "IODOUS"],
      "6": ["BEFORE", "CHANGE", "CALLED", "SHOULD", "PEOPLE", "NUMBER", "ALWAYS", "AROUND", "BECAME", "BETTER", "FATHER", "FOLLOW", "FRIEND", "MOTHER", "SECOND", "SYSTEM", "THOUGH", "DURING", "THINGS", "TURNED", "LIVING", "TAKING", "MAKING", "HAVING", "COMING", "LITTLE", "REALLY"],
      "7": ["ANOTHER", "BETWEEN", "BECAUSE", "THROUGH", "PRESENT", "SEVERAL", "WITHOUT", "AGAINST", "GENERAL", "MORNING", "HIMSELF", "HERSELF", "NOTHING", "WORKING", "PICTURE", "PROBLEM", "SPECIAL", "FEELING", "REQUIRE"],
      "8": ["TOGETHER", "FINISHED", "BUSINESS", "CHILDREN", "SUDDENLY", "QUESTION", "BUILDING", "YOURSELF", "NATIONAL", "POSITION", "ALTHOUGH", "ANALYSIS"]
    };
  }
}

function filterWordListByGrade(wordsByLengthBase, grade = "6-12") {
  // Grade levels determine max word length
  const maxLenByGrade = {
    "K": 5,
    "1st": 6,
    "2nd": 6,
    "3rd-5th": 8,
    "6-12": 8,
    "Reader Mode": 8,
  };

  const maxLen = maxLenByGrade[grade] || 8;

  const filtered = {};
  for (let len = 3; len <= maxLen; len++) {
    filtered[len] = Array.isArray(wordsByLengthBase[len]) ? [...wordsByLengthBase[len]] : [];
  }
  return filtered;
}

function buildWordList(topicWords, wordsByLengthBase, grade = "6-12") {
  // Filter wordlist by grade first
  const wordsByLength = filterWordListByGrade(wordsByLengthBase, grade);

  // Add topic words first (prioritized, at the beginning)
  if (topicWords && Array.isArray(topicWords)) {
    for (const word of topicWords) {
      const w = String(word).toUpperCase();
      const len = w.length;
      const maxLen = filterWordListByGrade(wordsByLengthBase, grade);
      if (len >= 3 && len <= 8 && maxLen[len] && !wordsByLength[len].includes(w)) {
        wordsByLength[len].unshift(w);
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
  for (let i = slotOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slotOrder[i], slotOrder[j]] = [slotOrder[j], slotOrder[i]];
  }

  // Greedy fill: for each slot, find candidates and pick randomly (not just first)
  for (const si of slotOrder) {
    const slot = slots[si];
    const len = slot.length;
    const words = wordsByLength[len] || [];

    // Find all matching candidates
    const candidates = [];
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
        candidates.push(word);
      }
    }

    if (candidates.length === 0) return null; // Dead end, restart

    // Pick random candidate (not just first) to increase diversity
    const word = candidates[Math.floor(Math.random() * candidates.length)];

    // Place word
    for (let i = 0; i < len; i++) {
      const [r, c] = slot[i];
      grid[`${r},${c}`] = word[i];
    }
    used.add(word);
    assignment[si] = word;
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
  const { pattern, slots, topicWords = [], seed = 0, grade = "6-12" } = req.body;
  if (!pattern || !slots) return res.status(400).json({ error: "Missing data" });

  try {
    // Load wordlist
    const wordlistData = await loadWordlist();
    const wordsByLength = buildWordList(topicWords, wordlistData, grade);

    // Debug: log wordlist sizes
    let totalWords = 0;
    for (let len = 3; len <= 8; len++) {
      const count = (wordsByLength[len] || []).length;
      totalWords += count;
      console.log(`[grid-builder] Length ${len}: ${count} words`);
    }
    console.log(`[grid-builder] Total: ${totalWords} words, Grade: ${grade}, Slots: ${slots.length}`);

    // Random-restart greedy: try up to 100 times with different slot orders
    for (let attempt = 0; attempt < 100; attempt++) {
      const result = greedyFill(pattern, slots, wordsByLength, attempt);
      if (result && result.success) {
        console.log(`[grid-builder] Success on attempt ${attempt + 1}`);
        return res.status(200).json(result);
      }
    }

    return res.status(400).json({ error: "Could not fill grid after 100 attempts" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
