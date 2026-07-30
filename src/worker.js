const GOOGLE_CMP_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'IS','LI','NO','GB','CH'
]);

export function privacyRegionForCountry(country) {
  return GOOGLE_CMP_COUNTRIES.has(String(country || '').toUpperCase())
    ? 'google-cmp'
    : 'site-consent';
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const region = privacyRegionForCountry(request.cf?.country);
    return new HTMLRewriter()
      .on('html', {
        element(element) {
          element.setAttribute('data-privacy-region', region);
        }
      })
      .transform(response);
  }
};
