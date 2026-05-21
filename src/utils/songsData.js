/**
 * StoryClue — K-2 Songs & Rhymes Library
 *
 * Pre-loaded, curriculum-grounded song list for Early Learners.
 * Every song is available for any grade that includes it (cumulative).
 * Faith-based songs appear ONLY when a non-secular faith tradition is selected.
 * Secular/universal songs are ALWAYS shown regardless of faith tradition.
 */

// ── Category metadata ──────────────────────────────────────────────────────
export const SONG_CATEGORIES = {
  "nursery-rhyme":  { label: "Nursery Rhymes",       emoji: "🐑" },
  "action":         { label: "Action & Movement",    emoji: "🕺" },
  "learning":       { label: "Learning Songs",       emoji: "🔤" },
  "seasonal":       { label: "Seasonal & Holiday",   emoji: "🎄" },
  "classic":        { label: "Classic Songs",        emoji: "🎵" },
  "folk":           { label: "Folk Songs",           emoji: "🪕" },
  "patriotic":      { label: "Patriotic",            emoji: "🇺🇸" },
  "faith":          { label: "Faith Songs",          emoji: "✝️" },
};

// ── Song list ──────────────────────────────────────────────────────────────
// grades:          which grade levels include this song (cumulative — if "1" is
//                  listed, it's also available for "2", etc.)
// minGrade:        earliest grade this song appears in ("k", "1", or "2")
// faithTraditions: [] = secular/universal (always shown)
//                  ["christian-protestant","christian-catholic"] = only shown for those traditions
export const SONGS = [

  // ── KINDERGARTEN — Nursery Rhymes ─────────────────────────────────────────
  { id:"twinkle-twinkle",      title:"Twinkle Twinkle Little Star",     emoji:"⭐", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"humpty-dumpty",        title:"Humpty Dumpty",                   emoji:"🥚", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"jack-and-jill",        title:"Jack and Jill",                   emoji:"⛲", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"itsy-bitsy-spider",    title:"Itsy Bitsy Spider",               emoji:"🕷️", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"old-macdonald",        title:"Old MacDonald Had a Farm",        emoji:"🐄", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"row-your-boat",        title:"Row Row Row Your Boat",           emoji:"🚣", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"wheels-on-the-bus",    title:"Wheels on the Bus",               emoji:"🚌", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"baa-baa-black-sheep",  title:"Baa Baa Black Sheep",             emoji:"🐑", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"mary-had-a-lamb",      title:"Mary Had a Little Lamb",          emoji:"🐏", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"little-miss-muffet",   title:"Little Miss Muffet",              emoji:"🕷️", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"hickory-dickory-dock", title:"Hickory Dickory Dock",            emoji:"🕐", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"ring-around-the-rosie",title:"Ring Around the Rosie",           emoji:"💐", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"london-bridge",        title:"London Bridge Is Falling Down",   emoji:"🌉", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"three-blind-mice",     title:"Three Blind Mice",                emoji:"🐭", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"hey-diddle-diddle",    title:"Hey Diddle Diddle",               emoji:"🐄", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"hot-cross-buns",       title:"Hot Cross Buns",                  emoji:"🍞", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"little-bo-peep",       title:"Little Bo Peep",                  emoji:"🐑", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"little-jack-horner",   title:"Little Jack Horner",              emoji:"🥧", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"one-two-buckle",       title:"One Two Buckle My Shoe",          emoji:"👟", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },
  { id:"five-little-ducks",    title:"Five Little Ducks",               emoji:"🦆", minGrade:"k", category:"nursery-rhyme", faithTraditions:[] },

  // ── KINDERGARTEN — Action & Movement ─────────────────────────────────────
  { id:"if-youre-happy",       title:"If You're Happy and You Know It", emoji:"😄", minGrade:"k", category:"action", faithTraditions:[] },
  { id:"head-shoulders",       title:"Head Shoulders Knees and Toes",  emoji:"🙆", minGrade:"k", category:"action", faithTraditions:[] },
  { id:"hokey-pokey",          title:"Hokey Pokey",                     emoji:"💃", minGrade:"k", category:"action", faithTraditions:[] },
  { id:"farmer-in-the-dell",   title:"The Farmer in the Dell",         emoji:"🚜", minGrade:"k", category:"action", faithTraditions:[] },
  { id:"mulberry-bush",        title:"Here We Go Round the Mulberry Bush", emoji:"🌿", minGrade:"k", category:"action", faithTraditions:[] },
  { id:"skip-to-my-lou",       title:"Skip to My Lou",                  emoji:"🎶", minGrade:"k", category:"action", faithTraditions:[] },
  { id:"this-old-man",         title:"This Old Man",                    emoji:"👴", minGrade:"k", category:"action", faithTraditions:[] },
  { id:"down-by-the-bay",      title:"Down by the Bay",                 emoji:"🌊", minGrade:"k", category:"action", faithTraditions:[] },

  // ── KINDERGARTEN — Learning Songs ─────────────────────────────────────────
  { id:"abc-song",             title:"ABC Song",                        emoji:"🔤", minGrade:"k", category:"learning", faithTraditions:[] },
  { id:"days-of-the-week",     title:"Days of the Week",                emoji:"📅", minGrade:"k", category:"learning", faithTraditions:[] },
  { id:"months-of-the-year",   title:"Months of the Year",              emoji:"🗓️", minGrade:"k", category:"learning", faithTraditions:[] },
  { id:"counting-song",        title:"One Two Three Four Five",         emoji:"🖐️", minGrade:"k", category:"learning", faithTraditions:[] },

  // ── KINDERGARTEN — Seasonal & Holiday ────────────────────────────────────
  { id:"jingle-bells",         title:"Jingle Bells",                    emoji:"🔔", minGrade:"k", category:"seasonal", faithTraditions:[] },
  { id:"rudolph",              title:"Rudolph the Red-Nosed Reindeer",  emoji:"🦌", minGrade:"k", category:"seasonal", faithTraditions:[] },
  { id:"frosty",               title:"Frosty the Snowman",              emoji:"⛄", minGrade:"k", category:"seasonal", faithTraditions:[] },
  { id:"you-are-my-sunshine",  title:"You Are My Sunshine",             emoji:"☀️", minGrade:"k", category:"seasonal", faithTraditions:[] },
  { id:"happy-birthday",       title:"Happy Birthday",                  emoji:"🎂", minGrade:"k", category:"seasonal", faithTraditions:[] },

  // ── 1ST GRADE — Classic Songs (new) ──────────────────────────────────────
  { id:"shell-be-coming",      title:"She'll Be Coming Round the Mountain", emoji:"⛰️", minGrade:"1", category:"classic", faithTraditions:[] },
  { id:"oh-susanna",           title:"Oh Susanna",                      emoji:"🎸", minGrade:"1", category:"classic", faithTraditions:[] },
  { id:"home-on-the-range",    title:"Home on the Range",               emoji:"🏔️", minGrade:"1", category:"classic", faithTraditions:[] },
  { id:"my-bonnie",            title:"My Bonnie Lies Over the Ocean",   emoji:"🌊", minGrade:"1", category:"classic", faithTraditions:[] },
  { id:"on-top-old-smoky",     title:"On Top of Old Smoky",             emoji:"🌲", minGrade:"1", category:"classic", faithTraditions:[] },
  { id:"this-land",            title:"This Land Is Your Land",          emoji:"🗺️", minGrade:"1", category:"classic", faithTraditions:[] },
  { id:"america-beautiful",    title:"America the Beautiful",           emoji:"🏔️", minGrade:"1", category:"patriotic", faithTraditions:[] },
  { id:"yankee-doodle",        title:"Yankee Doodle",                   emoji:"🎩", minGrade:"1", category:"patriotic", faithTraditions:[] },

  // ── 1ST GRADE — Folk Songs (new) ─────────────────────────────────────────
  { id:"kumbaya",              title:"Kumbaya",                         emoji:"🔥", minGrade:"1", category:"folk", faithTraditions:[] },
  { id:"michael-row",          title:"Michael Row the Boat Ashore",     emoji:"⛵", minGrade:"1", category:"folk", faithTraditions:[] },
  { id:"oh-my-darling",        title:"Oh My Darling Clementine",        emoji:"🍊", minGrade:"1", category:"folk", faithTraditions:[] },
  { id:"simple-gifts",         title:"Simple Gifts",                    emoji:"🎁", minGrade:"1", category:"folk", faithTraditions:[] },
  { id:"swing-low",            title:"Swing Low Sweet Chariot",         emoji:"🌅", minGrade:"1", category:"folk", faithTraditions:[] },

  // ── 2ND GRADE — Patriotic (new) ──────────────────────────────────────────
  { id:"star-spangled-banner", title:"The Star-Spangled Banner",        emoji:"🇺🇸", minGrade:"2", category:"patriotic", faithTraditions:[] },
  { id:"my-country",           title:"My Country 'Tis of Thee",         emoji:"🗽", minGrade:"2", category:"patriotic", faithTraditions:[] },
  { id:"grand-old-flag",       title:"You're a Grand Old Flag",         emoji:"🚩", minGrade:"2", category:"patriotic", faithTraditions:[] },
  { id:"battle-hymn",          title:"Battle Hymn of the Republic",     emoji:"⚔️", minGrade:"2", category:"patriotic", faithTraditions:[] },

  // ── 2ND GRADE — Classic Folk & Camp (new) ────────────────────────────────
  { id:"down-in-the-valley",   title:"Down in the Valley",              emoji:"🌄", minGrade:"2", category:"folk", faithTraditions:[] },
  { id:"red-river-valley",     title:"Red River Valley",                emoji:"🌊", minGrade:"2", category:"folk", faithTraditions:[] },
  { id:"scarborough-fair",     title:"Scarborough Fair",                emoji:"🌿", minGrade:"2", category:"folk", faithTraditions:[] },
  { id:"greensleeves",         title:"Greensleeves",                    emoji:"💚", minGrade:"2", category:"folk", faithTraditions:[] },

  // ── FAITH — Christian (Protestant & Catholic) ─────────────────────────────
  { id:"jesus-loves-me",       title:"Jesus Loves Me",                  emoji:"❤️", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"this-little-light",    title:"This Little Light of Mine",       emoji:"🕯️", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"hes-got-the-whole-world",title:"He's Got the Whole World",      emoji:"🌍", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"jesus-loves-children", title:"Jesus Loves the Little Children", emoji:"👧", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"deep-and-wide",        title:"Deep and Wide",                   emoji:"🌊", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"the-bible",            title:"The B-I-B-L-E",                   emoji:"📖", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"zacchaeus",            title:"Zacchaeus",                       emoji:"🌳", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"joshua-jericho",       title:"Joshua Fought the Battle of Jericho", emoji:"🏰", minGrade:"1", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"amazing-grace",        title:"Amazing Grace",                   emoji:"🙏", minGrade:"1", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"away-in-a-manger",     title:"Away in a Manger",                emoji:"🌟", minGrade:"k", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"silent-night",         title:"Silent Night",                    emoji:"🌙", minGrade:"1", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },
  { id:"joy-to-the-world",     title:"Joy to the World",                emoji:"🎉", minGrade:"1", category:"faith", faithTraditions:["christian-protestant","christian-catholic"] },

  // ── FAITH — Jewish ────────────────────────────────────────────────────────
  { id:"dreidel",              title:"Dreidel Dreidel Dreidel",         emoji:"🕍", minGrade:"k", category:"faith", faithTraditions:["jewish"] },
  { id:"hanukkah",             title:"Hanukkah Oh Hanukkah",            emoji:"🕎", minGrade:"k", category:"faith", faithTraditions:["jewish"] },
  { id:"shabbat-shalom",       title:"Shabbat Shalom",                  emoji:"🕯️", minGrade:"k", category:"faith", faithTraditions:["jewish"] },
  { id:"am-yisrael",           title:"Am Yisrael Chai",                 emoji:"✡️", minGrade:"1", category:"faith", faithTraditions:["jewish"] },
  { id:"dayenu",               title:"Dayenu",                          emoji:"🍷", minGrade:"1", category:"faith", faithTraditions:["jewish"] },
];

// Grade ordering for cumulative inclusion
const GRADE_ORDER = ["k", "1", "2"];

/**
 * Returns songs available for a given grade + faith tradition.
 * Cumulative: grade "2" includes all songs from k, 1, and 2.
 * Faith songs only appear when a matching tradition is selected.
 */
export function getSongsForGrade(grade, faithTradition = "none") {
  const gradeIdx = GRADE_ORDER.indexOf(String(grade));
  if (gradeIdx === -1) return [];

  const allowedMinGrades = GRADE_ORDER.slice(0, gradeIdx + 1);

  return SONGS.filter(song => {
    // Grade check: song's minGrade must be at or below the current grade
    if (!allowedMinGrades.includes(song.minGrade)) return false;

    // Faith check
    if (song.faithTraditions.length === 0) return true; // secular/universal — always shown
    if (!faithTradition || faithTradition === "none") return false; // no tradition — hide faith songs
    return song.faithTraditions.includes(faithTradition);
  });
}

/**
 * Groups a song list by category, preserving SONG_CATEGORIES display order.
 * Returns array of { categoryId, label, emoji, songs: [...] }
 */
export function groupSongsByCategory(songs) {
  const order = Object.keys(SONG_CATEGORIES);
  const map = {};
  for (const song of songs) {
    if (!map[song.category]) map[song.category] = [];
    map[song.category].push(song);
  }
  return order
    .filter(catId => map[catId]?.length)
    .map(catId => ({
      categoryId: catId,
      label: SONG_CATEGORIES[catId].label,
      emoji: SONG_CATEGORIES[catId].emoji,
      songs: map[catId],
    }));
}
