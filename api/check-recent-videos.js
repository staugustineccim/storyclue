// Check which churches have posted videos in the last 7 days
async function getChannelIdFromUrl(channelUrl) {
  const directMatch = channelUrl.match(/\/channel\/(UC[^/?]+)/);
  if (directMatch) return directMatch[1];

  if (channelUrl.includes("/@") || channelUrl.includes("/c/") || channelUrl.includes("/user/")) {
    try {
      const res = await fetch(channelUrl);
      const html = await res.text();
      const match = html.match(/"channelId":"(UC[^"]+)"/);
      if (match) return match[1];
    } catch (err) {
      return null;
    }
  }

  if (channelUrl.includes("/watch?v=") || channelUrl.includes("?v=")) {
    try {
      const res = await fetch(channelUrl);
      const html = await res.text();
      const match = html.match(/"channelId":"(UC[^"]+)"/);
      if (match) return match[1];
    } catch (err) {
      return null;
    }
  }

  return null;
}

async function getNewestVideo(channelId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set");

  const url = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&order=date&part=snippet&key=${apiKey}&maxResults=1`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.items || !data.items[0]) return null;

  const item = data.items[0];
  if (!item.id.videoId) return null;

  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    published: new Date(item.snippet.publishedAt),
  };
}

const churches = [
  {"church_name":"Colonial Church St. Augustine","youtube_channel":"https://www.youtube.com/c/colonialchurchsta"},
  {"church_name":"Grace and Faith Church","youtube_channel":"https://www.youtube.com/c/graceandfaithchurch"},
  {"church_name":"The Church of Eleven22","youtube_channel":"https://www.youtube.com/channel/UCqB8wwurUvy5OifhjFR429Q"},
  {"church_name":"Oasis Church","youtube_channel":"https://www.youtube.com/@OasisChurchFL941"},
  {"church_name":"House Of Faith","youtube_channel":"https://www.youtube.com/c/HouseOfFaith"},
  {"church_name":"Cape Christian","youtube_channel":"https://www.youtube.com/c/CapeChristian"},
  {"church_name":"Christ's Family Christian Church","youtube_channel":"https://www.youtube.com/@cfcc.church"},
  {"church_name":"Redemption Hill Church","youtube_channel":"https://www.youtube.com/@RHchurchTLH"},
  {"church_name":"Central Florida Church of God","youtube_channel":"https://www.youtube.com/channel/UCaMU5dcXVSW_Y2jVm871tsQ"},
  {"church_name":"Florida Faith Church","youtube_channel":"https://www.youtube.com/channel/UC1qnFAsBfE8gW9yJqdoTACA"},
  {"church_name":"Faith Church Brooksville","youtube_channel":"https://www.youtube.com/channel/UCCw4buUG0pjbie24fSnHVRg"},
  {"church_name":"Paramount Church","youtube_channel":"https://www.youtube.com/ParamountChurch"},
  {"church_name":"Florida Coast Church","youtube_channel":"https://www.youtube.com/@floridacoastchurch"},
  {"church_name":"First Church Miami","youtube_channel":"https://www.youtube.com/@firstchurchmiami"},
  {"church_name":"Life Church Miami","youtube_channel":"https://www.youtube.com/@LifeChurchMiami"},
  {"church_name":"Radiant Church","youtube_channel":"https://www.youtube.com/channel/UCtvD-CHWq4NShfNYUo_EnPQ"},
  {"church_name":"New Birth Baptist Church Miami","youtube_channel":"https://www.youtube.com/newbirthbaptistchurchmiami"},
  {"church_name":"First Baptist Church of Palm Coast","youtube_channel":"https://www.youtube.com/channel/UCCFt9Zi4-t9qd_YsjcUiNcQ"},
  {"church_name":"Pentecostal Tabernacle International","youtube_channel":"https://www.youtube.com/pentabint"},
  {"church_name":"Central Assembly","youtube_channel":"https://www.youtube.com/@centralassemblyvero"},
  {"church_name":"Florida City First Assembly of God","youtube_channel":"https://www.youtube.com/channel/UCl8M0fMJG7f2bRcGqwxli_g"},
  {"church_name":"Open Door Church","youtube_channel":"https://www.youtube.com/c/OpenDoorChurch"},
  {"church_name":"Grace Gospel Church","youtube_channel":"https://www.youtube.com/channel/UCVJ4FbL4VnWtnr8oTWZ6TRQ"},
  {"church_name":"Grace Fellowship Church","youtube_channel":"https://www.youtube.com/@gracefellowshipchurchfl"},
  {"church_name":"New Life Church Ministries","youtube_channel":"https://www.youtube.com/channel/UCGFKr_fuwBELtryrAy38dsg"},
  {"church_name":"Cornerstone Christian Church","youtube_channel":"https://www.youtube.com/channel/UCbRhDZn1GRuYMUFQ-B7sP2g"},
  {"church_name":"West Broward Church Of Christ","youtube_channel":"https://www.youtube.com/channel/UCwOwC4IM4CCk1ucFlkJhslg"},
  {"church_name":"Volusia County Baptist Church","youtube_channel":"https://www.youtube.com/@volusiacountybaptistchurch4097"},
  {"church_name":"Seminole Community Church","youtube_channel":"https://www.youtube.com/@seminolecommunitychurch3634"},
  {"church_name":"Central Baptist Church","youtube_channel":"https://www.youtube.com/channel/UCNdZBljkW90NauiFnBUhZ1g"},
  {"church_name":"Abundant Life Church","youtube_channel":"https://www.youtube.com/channel/UCkwIAZWVGGTPWe4CZcPTR_Q"},
  {"church_name":"Alive Church","youtube_channel":"https://www.youtube.com/c/alivechurchlive"},
  {"church_name":"Central Christian Church","youtube_channel":"https://www.youtube.com/@clearwaterdisciples.org"},
  {"church_name":"River City Baptist Church","youtube_channel":"https://www.youtube.com/channel/UCTxzZvRBmtvl9iFktVA0YuQ"},
  {"church_name":"The River at Tampa Bay Church","youtube_channel":"https://www.youtube.com/user/rodneyhowardbrowne"}
];

export default async function handler(req, res) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const results = [];

  console.log(`[Check] Checking ${churches.length} churches for recent videos...`);

  for (const church of churches) {
    try {
      const channelId = await getChannelIdFromUrl(church.youtube_channel);

      if (!channelId) {
        results.push({
          church: church.church_name,
          status: "no_channel_id"
        });
        continue;
      }

      const video = await getNewestVideo(channelId);

      if (!video) {
        results.push({
          church: church.church_name,
          status: "no_videos"
        });
        continue;
      }

      const isRecent = video.published > sevenDaysAgo;
      results.push({
        church: church.church_name,
        status: isRecent ? "recent" : "old",
        lastVideo: video.title,
        publishedDaysAgo: Math.floor((Date.now() - video.published.getTime()) / (24 * 60 * 60 * 1000))
      });
    } catch (err) {
      results.push({
        church: church.church_name,
        status: "error",
        error: err.message
      });
    }
  }

  const stats = {
    total: churches.length,
    recent: results.filter(r => r.status === "recent").length,
    old: results.filter(r => r.status === "old").length,
    no_videos: results.filter(r => r.status === "no_videos").length,
    no_channel_id: results.filter(r => r.status === "no_channel_id").length,
    errors: results.filter(r => r.status === "error").length
  };

  res.status(200).json({ stats, results });
}
