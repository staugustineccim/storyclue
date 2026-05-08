import { encodePuzzle } from "./urlEncoder";
import { buildGrid, buildNumbering } from "./layoutBuilder";

// Charlotte's Web Chapter 1 — original hand-placed grid (22 rows × 23 cols)
const ROWS = 22;
const COLS = 23;

const CW_LAYOUT = [
  { answer: "WILBUR",        orientation: "across", starty: 9,  startx: 0  },
  { answer: "FERN",          orientation: "down",   starty: 8,  startx: 9  },
  { answer: "RUNT",          orientation: "down",   starty: 8,  startx: 4  },
  { answer: "INJUSTICE",     orientation: "across", starty: 10, startx: 14 },
  { answer: "AVERY",         orientation: "across", starty: 9,  startx: 7  },
  { answer: "LITTER",        orientation: "down",   starty: 10, startx: 12 },
  { answer: "BOTTLE",        orientation: "across", starty: 6,  startx: 6  },
  { answer: "BARN",          orientation: "across", starty: 13, startx: 5  },
  { answer: "APPETITE",      orientation: "down",   starty: 0,  startx: 8  },
  { answer: "AX",            orientation: "down",   starty: 11, startx: 10 },
  { answer: "ARABLE",        orientation: "down",   starty: 13, startx: 6  },
  { answer: "BREAKFAST",     orientation: "across", starty: 15, startx: 0  },
  { answer: "SOAKING",       orientation: "down",   starty: 6,  startx: 14 },
  { answer: "PIGPEN",        orientation: "across", starty: 18, startx: 2  },
  { answer: "DETERMINATION", orientation: "across", starty: 11, startx: 2  },
  { answer: "JEALOUS",       orientation: "across", starty: 20, startx: 5  },
  { answer: "FARMER",        orientation: "down",   starty: 8,  startx: 7  },
  { answer: "SPRING",        orientation: "across", starty: 15, startx: 10 },
  { answer: "MERCY",         orientation: "down",   starty: 5,  startx: 11 },
  { answer: "PROMISE",       orientation: "down",   starty: 15, startx: 11 },
];

const GRADE_CLUES = {
  "2": [
    "The little pink pig Fern saves",
    "The girl who saves the baby pig",
    "The tiniest, weakest baby pig",
    "Fern says this is happening when something is not fair",
    "Fern's big brother",
    "All the baby animals born together",
    "Fern fed Wilbur from one of these",
    "Where the animals live on the farm",
    "Wilbur loves to eat — he has a big one",
    "The sharp tool daddy was carrying",
    "Fern's family last name",
    "The morning meal Fern's mom was making",
    "Very wet — like the grass in the morning",
    "Where the pigs live outside",
    "Fern really wanted to save Wilbur — she had ____",
    "How Avery felt — he wanted a pig too",
    "Someone who grows food and raises animals",
    "The season with baby animals and new flowers",
    "Fern asked her dad to be kind — to show ____",
    "Daddy made Fern a ____ — she had to feed Wilbur herself",
  ],
  "3": [
    "The runt pig Fern saves from being killed",
    "The brave 8-year-old girl who rescues the pig",
    "The smallest, weakest animal in a litter",
    "Fern says killing a small pig because of its size is this",
    "Fern's older brother who also wants a pig",
    "A group of baby animals born at the same time",
    "Fern fed baby Wilbur from one of these",
    "The farm building where animals live",
    "Wilbur had a good one — he loved to eat",
    "The sharp tool Mr. Arable was carrying",
    "Fern's family last name",
    "The meal being prepared when Fern sees her father",
    "The wet condition of the early morning ground",
    "The enclosure where the pigs are kept on the farm",
    "Fern showed great ____ in saving Wilbur",
    "How Avery felt when Fern got a pet pig",
    "What Mr. Arable is — he works the land",
    "The season when the story begins — new life everywhere",
    "What Fern begged her father to show the runt pig",
    "Mr. Arable made Fern this — she must care for Wilbur",
  ],
  "4": [
    "The undersized piglet whose survival depends on Fern's intervention",
    "The determined young girl whose sense of justice drives the story",
    "The smallest and weakest offspring in a litter, often at risk",
    "Treating someone unfairly because of their size or weakness",
    "Fern's older brother whose jealousy adds tension at breakfast",
    "The collective birth group from which Wilbur emerged as the weakest",
    "The feeding tool Fern used to nurse Wilbur at the breakfast table",
    "The farm structure that becomes Wilbur's permanent home",
    "The vigorous hunger that proved Wilbur could thrive despite his size",
    "The implement Mr. Arable carried to end the runt's life",
    "The family surname — also means land fit for growing crops",
    "The morning meal interrupted by Fern's moral stand",
    "The wet early-morning condition that greeted Fern outside",
    "The outdoor enclosure where farm pigs are kept",
    "The fierce resolve Fern showed in protecting a helpless animal",
    "The emotion Avery displayed when Fern received special treatment",
    "What Mr. Arable is by trade — he cultivates the land",
    "The season of new beginnings in which the story opens",
    "The compassion Fern pleaded for on behalf of the runt",
    "The commitment Mr. Arable extracted from Fern before surrendering Wilbur",
  ],
  "5": [
    "The vulnerable runt whose survival Fern fights to ensure",
    "The protagonist whose moral conviction saves an innocent life",
    "Term for the smallest, weakest offspring in an animal litter",
    "The absence of fairness — what Fern accuses her father of",
    "The sibling whose opportunistic jealousy contrasts with Fern's principled stand",
    "The collective group of animals born to one mother at one time",
    "The instrument of nurture Fern employed to sustain the fragile piglet",
    "The pastoral structure central to the story's primary setting",
    "The strong desire for food that signaled Wilbur's will to survive",
    "The instrument whose appearance sets the moral conflict in motion",
    "The family name that doubles as a word for arable farmland",
    "The morning meal whose routine is shattered by Fern's moral outrage",
    "The saturated morning conditions that frame the story's dramatic opening",
    "The outdoor enclosure symbolic of Wilbur's vulnerable early existence",
    "The unwavering resolve Fern demonstrates in confronting her father's authority",
    "The resentful emotion Avery harbors toward Fern's privileged treatment",
    "The agricultural identity of Mr. Arable — one who cultivates land",
    "The season of renewal and new life in which the narrative begins",
    "The compassion and leniency Fern implores her father to extend",
    "The binding commitment Mr. Arable extracts before relinquishing the piglet",
  ],
};

export function buildDemoData(grade = "3") {
  const clues = GRADE_CLUES[grade] || GRADE_CLUES["3"];
  const words = CW_LAYOUT.map((w, i) => ({ ...w, clue: clues[i] }));
  const nums = buildNumbering(words, ROWS, COLS);
  return {
    title: "Charlotte's Web — Chapter 1",
    grade,
    rows: ROWS,
    cols: COLS,
    words: words.map(w => ({
      ...w,
      number: nums[`${w.starty},${w.startx}`] || 0,
    })),
  };
}

// Pre-encoded demo URL (grade 3, computed once)
let _demoUrl = null;
export function getDemoUrl(grade = "3") {
  if (!_demoUrl || grade !== "3") {
    _demoUrl = "/play?p=" + encodePuzzle(buildDemoData(grade));
  }
  return _demoUrl;
}

export const SERIES_DATA = {
  "harry-potter": {
    name: "Harry Potter",
    author: "J.K. Rowling",
    books: [
      "The Philosopher's Stone",
      "The Chamber of Secrets",
      "The Prisoner of Azkaban",
      "The Goblet of Fire",
      "The Order of the Phoenix",
      "The Half-Blood Prince",
      "The Deathly Hallows",
    ],
  },
  "reacher": {
    name: "Jack Reacher",
    author: "Lee Child",
    books: [
      "Killing Floor", "Die Trying", "Tripwire", "The Visitor", "Echo Burning",
      "Without Fail", "Persuader", "The Enemy", "One Shot", "The Hard Way",
      "Bad Luck and Trouble", "Nothing to Lose", "Gone Tomorrow", "61 Hours",
      "Worth Dying For", "The Affair", "A Wanted Man", "Never Go Back",
      "Personal", "Make Me", "Night School", "The Midnight Line",
      "Past Tense", "Blue Moon", "The Sentinel", "Better Off Dead", "No Plan B",
    ],
  },
  "charlottes-web": {
    name: "Charlotte's Web & E.B. White",
    author: "E.B. White",
    books: ["Charlotte's Web", "Stuart Little", "The Trumpet of the Swan"],
  },
  "wimpy-kid": {
    name: "Diary of a Wimpy Kid",
    author: "Jeff Kinney",
    books: [
      "Diary of a Wimpy Kid", "Rodrick Rules", "The Last Straw", "Dog Days",
      "The Ugly Truth", "Cabin Fever", "The Third Wheel", "Hard Luck",
      "The Long Haul", "Old School", "Double Down", "The Getaway",
      "The Meltdown", "Wrecking Ball", "The Deep End", "Big Shot",
      "Diper Överlöde",
    ],
  },
  "nancy-drew": {
    name: "Nancy Drew Mysteries",
    author: "Carolyn Keene",
    books: [
      "The Secret of the Old Clock", "The Hidden Staircase",
      "The Bungalow Mystery", "The Mystery at Lilac Inn",
      "The Secret at Shadow Ranch", "The Secret of Red Gate Farm",
      "The Clue in the Diary", "Nancy's Mysterious Letter",
      "The Sign of the Twisted Candles", "Password to Larkspur Lane",
    ],
  },
  "bible": {
    name: "The Bible (King James Version)",
    author: "King James Version",
    books: [
      "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
      "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
      "1 Kings", "2 Kings", "Psalms", "Proverbs", "Isaiah",
      "Matthew", "Mark", "Luke", "John", "Acts",
      "Romans", "Revelation",
    ],
  },
  "narnia": {
    name: "The Chronicles of Narnia",
    author: "C.S. Lewis",
    books: [
      "The Lion, the Witch and the Wardrobe",
      "Prince Caspian",
      "The Voyage of the Dawn Treader",
      "The Silver Chair",
      "The Horse and His Boy",
      "The Magician's Nephew",
      "The Last Battle",
    ],
  },
};
