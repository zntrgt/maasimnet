# AI crawler erişim politikası

İnceleme: 25 Kasım 2026. Kaynak: content/robots.txt. Bu belge mevcut tercihleri kaydeder; Cloudflare hesabındaki gerçek bot izinlerini değiştirmez.

## Mevcut politika

- Genel arama: User-agent: * / Allow: /, Googlebot için özel engel yok.
- AI arama ve kullanıcı isteğiyle erişim: OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User izinli.
- Eğitim/toplu tarama için mevcut engel listesi: GPTBot, ClaudeBot, CCBot, Bytespider, meta-externalagent, Amazonbot, Applebot-Extended.
- Content-Signal: search=yes,ai-input=yes,ai-train=no,use=reference.
- Google-Extended: mevcut açık istisna Allow: /. Bu tercih yalnızca arama için izin anlamına gelmez. Google dokümantasyonuna göre Gemini/Vertex için eğitim ve arama dışı grounding birlikte kontrol edilir. Google Arama, AI Overviews ve AI Mode için ayrı kontroller geçerlidir. Google-Extended engeli tek başına Google Arama sıralaması veya dahil edilmesi üzerinde etkili değildir.
- **Karar bekliyor:** Eğer eğitimden çıkma öncelikliyse Google-Extended Disallow: / yapılması ve testin yeni karara uyarlanması gerekir; bu Gemini/Vertex grounding olanağını da kısıtlar. Gemini/Vertex görünürlüğü öncelikliyse mevcut Allow korunur ve eğitim istisnası kabul edilir. Bu PR, sahibin açık tercihi olmadan mevcut erişimi değiştirmez.

## Doğrulama ve sınırlar

- CI, üretilen robots.txt dosyasındaki açık kuralları ve sitemap bağlantısını doğrular.
- Mevcut production smoke, sitemap.xml, robots.txt ve llms.txt için HTTP başarısını denetler.
- Bunlar gerçek botun kimliğini veya tarama/indeksleme/AI kaynak gösterme durumunu kanıtlamaz. UA taklidi de doğrulanmış bot erişimi değildir.
- Cloudflare AI Crawl Control, Search/Agents/Training tercihleri ile robots kurallarının birlikte incelenmesi gerekir. Gerçek erişim için doğrulanmış bot isteklerinin Security Events kayıtlarında zaman, path, Ray ID, action ve kural adı kontrol edilir. Özel bir WAF kuralı görülmeden genel koruma kapatılmaz.
- Google Search Console'da Googlebot erişimi, seçilen canonical ve Search generative AI control tercihi ayrı kontrol edilir.
- llms.txt bir yardımcı kaynak listesi; sıralama veya AI atfı garantisi değildir.

Resmî kaynaklar (25.11.2026):
- https://developers.google.com/crawling/docs/google-extended
- https://developers.google.com/search/docs/fundamentals/gen-ai-controls
- https://developers.google.com/search/blog/2026/10/ai-training-control
- https://developers.openai.com/api/docs/bots
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
