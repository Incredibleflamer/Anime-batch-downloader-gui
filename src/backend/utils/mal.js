const { Mal } = require("node-myanimelist");
const auth = Mal.auth("d0b22d129a541dac4d28207f77b15b5f");
let account = null;
let pkce;

// Create A url
async function MalCreateUrl() {
  const pkceChallenge = (await import("pkce-challenge")).default;
  pkce = await pkceChallenge(128);
  const urlToRedirect = auth.getOAuthUrl(pkce.code_challenge);
  return urlToRedirect;
}

// Mal Verify Token
async function MalVerifyToken(code) {
  const data = await auth.authorizeWithCode(code, pkce.code_challenge);
  token = data.stringifyToken();
  await MalLogin(token);
  return {
    mal_on_off: true,
    malToken: token,
  };
}

// refresh the token
async function MalRefreshTokenGen(json) {
  refresh_token = JSON.parse(json).refresh_token;
  const data = await auth.authorizeWithRefreshToken(refresh_token);
  token = data.stringifyToken();
  await MalLogin(token);
  return {
    mal_on_off: true,
    malToken: token,
  };
}

// login to mal
async function MalLogin(jsonStr) {
  const token = Mal.MalToken.fromJsonString(jsonStr);
  account = auth.loadToken(token);
}

// Add To List
async function MalAddToList(malid, status) {
  try {
    const animeDetails = await account.anime
      .details(malid, Mal.Anime.detailsFields().myListStatus())
      .call();

    if (
      !animeDetails?.my_list_status ||
      animeDetails.my_list_status.status !== status
    ) {
      await account.anime
        .updateMyAnime(malid, {
          status: status,
        })
        .call();
    }
    return true;
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
  MalLogin,
  MalAddToList,
};
