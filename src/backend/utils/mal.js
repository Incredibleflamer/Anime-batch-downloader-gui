const { logger } = require("./AppLogger");
const NodeCache = require("node-cache");
const axios = require("axios");

const MalAppID = "d0b22d129a541dac4d28207f77b15b5f";
let MalAcount = null;
let pkce;
global.MalLoggedIn = false;

const cache = new NodeCache({ stdTTL: 60, checkperiod: 60 });

// Create A url
async function MalCreateUrl() {
  const pkceChallenge = (await import("pkce-challenge")).default;
  pkce = await pkceChallenge(128);
  return `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${MalAppID}&code_challenge_method=plain&code_challenge=${pkce.code_challenge}`;
}

// Mal Verify Token
async function MalVerifyToken(code) {
  try {
    const { data } = await axios.post(
      "https://myanimelist.net/v1/oauth2/token",
      new URLSearchParams({
        client_id: MalAppID,
        grant_type: "authorization_code",
        code: code,
        code_verifier: pkce.code_challenge,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    MalAcount = data;

    let token = JSON.stringify(data);
    global.MalLoggedIn = true;

    return {
      mal_on_off: true,
      malToken: token,
    };
  } catch (err) {
    console.log(`Error getting MAL token: \n ${err.response?.data} || ${err}`);
    logger.error(`Error getting MAL token: \n ${err.response?.data} || ${err}`);
    global.MalLoggedIn = false;

    return {
      mal_on_off: false,
      malToken: null,
    };
  }
}

// Mal Refresh Token
async function MalRefreshTokenGen(json) {
  try {
    let JsonToken = JSON.parse(json);

    if (!JsonToken || !JsonToken.refresh_token || !JsonToken.expires_in) {
      throw new Error("Invalid token data!");
    }

    let expires_at = Date.now() + JsonToken.expires_in * 1000;

    if (Date.now() >= expires_at) {
      logger.info("🔄 Token expired! Refreshing...");
      console.log("🔄 Token expired! Refreshing...");

      const { data } = await axios.post(
        "https://myanimelist.net/v1/oauth2/token",
        new URLSearchParams({
          client_id: MalAppID,
          grant_type: "refresh_token",
          refresh_token: JsonToken.refresh_token,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      MalAcount = data;
      let token = JSON.stringify(data);
      global.MalLoggedIn = true;

      return {
        mal_on_off: true,
        malToken: token,
      };
    }

    MalAcount = JsonToken;
    global.MalLoggedIn = true;

    return {
      mal_on_off: true,
      malToken: json,
    };
  } catch (err) {
    logger.error("Failed to refresh token:", err);
    console.log("Failed to refresh token:", err);
    global.MalLoggedIn = false;

    return {
      mal_on_off: false,
      malToken: null,
    };
  }
}

// Add To List
async function MalAddToList(type, malid, status, NumWatchedEp) {
  try {
    if (!MalAcount?.access_token)
      throw new Error("No access token please login");

    // checking in mal if entrie there
    const MylistEntrie = await axios.get(
      `https://api.myanimelist.net/v2/${type}/${malid}?fields=my_list_status`,
      {
        headers: {
          Authorization: `Bearer ${MalAcount.access_token}`,
        },
      }
    );

    // Adding In Myanimelist
    if (
      !MylistEntrie?.data?.my_list_status ||
      MylistEntrie?.data?.my_list_status !== status
    ) {
      await axios.put(
        `https://api.myanimelist.net/v2/anime/${animeId}/my_list_status`,
        new URLSearchParams({
          status: status,
          num_watched_episodes: NumWatchedEp
            ? NumWatchedEp
            : MylistEntrie?.data?.num_episodes_watched
            ? MylistEntrie?.data?.num_episodes_watched
            : 0,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${MalAcount.access_token}`,
          },
        }
      );
    }

    return true;
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    return false;
  }
}

// Fetch Anime / Manga List
async function MalFetchList(page = 1) {
  try {
    if (!MalAcount?.access_token)
      throw new Error("No access token please login");

    const cacheKey = `mal_list_${page}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const offset = (page - 1) * 30;

    let { data } = await axios.get(
      `https://api.myanimelist.net/v2/users/@me/animelist?nsfw=true&limit=30&offset=${offset}&status=watching&sort=list_updated_at&fields=list_status,num_episodes`,
      {
        headers: {
          Authorization: `Bearer ${MalAcount.access_token}`,
        },
      }
    );

    let AnimeList = data.data.map((items) => ({
      title: items?.node?.title,
      id: items?.node?.id,
      image:
        items?.node?.main_picture?.medium ??
        items?.node?.main_picture?.large ??
        null,
      totalEpisodes: items?.node?.num_episodes,
      watched: items?.list_status?.num_episodes_watched,
    }));

    cache.set(cacheKey, {
      hasNextPage: data?.paging?.next ?? false,
      results: AnimeList,
    });

    return {
      hasNextPage: data?.paging?.next ? true : false,
      results: AnimeList,
    };
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    return false;
  }
}

module.exports = {
  MalCreateUrl,
  MalVerifyToken,
  MalRefreshTokenGen,
  MalAddToList,
  MalFetchList,
};
