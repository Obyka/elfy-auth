// Écran de consentement OAuth d'Elfy (serveur OAuth 2.1 de Supabase Auth). Supabase y envoie le navigateur avec
// ?authorization_id=… ; on se connecte, on montre qui demande l'accès, puis on approuve ou refuse et Supabase rend
// l'adresse de retour vers le client (Claude).

const SUPABASE_URL = 'https://vlfsmeejyjdmhputnfnh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XqKz34czkXHKA_jL1eArYQ__bUjxQBW';

const $ = (id) => document.getElementById(id);
const setStatus = (text, error = false) => {
  $('status').textContent = text;
  $('status').hidden = !text;
  $('status').className = error ? 'error' : 'secondary';
};

// Pas d'affichage dans un cadre (détournement de clic) : GitHub Pages n'envoie pas d'en-tête frame-ancestors.
if (window.top !== window.self) {
  throw new Error('Affichage dans un cadre refusé.');
}
document.body.classList.add('ok');

const authorizationId = new URLSearchParams(location.search).get('authorization_id');

// Session limitée à l'onglet : rien ne reste sur obyka.github.io après la fermeture.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

async function showConsent() {
  setStatus('Chargement de la demande…');
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error) return setStatus(`Demande introuvable ou expirée : ${error.message}`, true);
  // Déjà autorisé : Supabase rend directement l'adresse de retour.
  if (!('authorization_id' in data)) {
    setStatus('Déjà autorisé, retour…');
    return location.assign(data.redirect_url);
  }
  $('client').textContent = data.client?.name || 'Une application';
  $('user').textContent = data.user?.email ?? '';
  try {
    $('redirect').textContent = new URL(data.redirect_uri).host;
  } catch {
    $('redirect').textContent = data.redirect_uri;
  }
  if (data.scope?.trim()) {
    $('scopes').textContent = data.scope.trim().split(/\s+/).join(', ');
    $('scopes-row').hidden = false;
  }
  setStatus('');
  $('login').hidden = true;
  $('consent').hidden = false;
}

async function decide(approve) {
  for (const id of ['approve', 'deny']) $(id).disabled = true;
  setStatus(approve ? 'Autorisation…' : 'Refus…');
  const call = approve ? supabase.auth.oauth.approveAuthorization : supabase.auth.oauth.denyAuthorization;
  const { data, error } = await call.call(supabase.auth.oauth, authorizationId, { skipBrowserRedirect: true });
  if (error) {
    for (const id of ['approve', 'deny']) $(id).disabled = false;
    return setStatus(error.message, true);
  }
  location.assign(data.redirect_url);
}

async function start() {
  if (!authorizationId) return setStatus('Cette page s’ouvre depuis une demande d’accès (authorization_id manquant).', true);
  const { data } = await supabase.auth.getSession();
  if (data.session) return showConsent();
  setStatus('');
  $('login').hidden = false;
  $('email').focus();
}

$('login').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Connexion…');
  const { error } = await supabase.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value,
  });
  $('password').value = '';
  if (error) return setStatus(error.message, true);
  await showConsent();
});
$('approve').addEventListener('click', () => decide(true));
$('deny').addEventListener('click', () => decide(false));
$('signout').addEventListener('click', async () => {
  await supabase.auth.signOut({ scope: 'local' });
  $('consent').hidden = true;
  $('login').hidden = false;
});

start().catch((e) => setStatus(String(e?.message ?? e), true));
