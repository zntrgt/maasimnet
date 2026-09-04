export const EDITORIAL_AUTHORITY = Object.freeze({
  site: Object.freeze({
    name: 'Maaşım.net',
    origin: 'https://maasim.net',
    organizationId: 'https://maasim.net/#organization'
  }),
  editorialTeam: Object.freeze({
    name: 'Maaşım.net Editoryal Ekibi',
    type: 'Organization',
    url: 'https://maasim.net/editoryal-politika/'
  }),
  paths: Object.freeze({
    about: '/hakkimizda/',
    editorialPolicy: '/editoryal-politika/',
    sourcePolicy: '/kaynak-politikasi/',
    methodology: '/hesaplama-metodolojisi/',
    contact: '/iletisim/'
  })
});

export function editorialTeamSchema() {
  return Object.freeze({
    '@type': EDITORIAL_AUTHORITY.editorialTeam.type,
    name: EDITORIAL_AUTHORITY.editorialTeam.name,
    url: EDITORIAL_AUTHORITY.editorialTeam.url,
    parentOrganization: { '@id': EDITORIAL_AUTHORITY.site.organizationId }
  });
}
