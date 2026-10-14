# Manish Giri Memorial School — Website

Cloudflare Pages-ready static website. The archive contains complete HTML pages and their shared CSS, JavaScript, images, school crest, and silent MP4 clips. Unzip it directly into a Cloudflare Pages static deployment; `index.html` is at the ZIP root.

## Pages

- `index.html`: Home, continuous photo carousel, school-life video moments
- `about.html`: Our Story
- `learning.html`: Learning
- `teachers.html`: Our People, principal's note and interactive teacher portraits
- `school-life.html`: School Life
- `gallery.html`: Photo Journal and full-screen image viewer
- `admissions.html`: Admissions
- `contact.html`: Contact details, school-location search and email-draft form
- `privacy.html`: Privacy & photographs
- `404.html`: Custom not-found page

## Deploy

1. Go to Cloudflare **Workers & Pages** and create a **Pages** project using static asset upload.
2. Upload the contents of the ZIP with the HTML files at the deployment root.
3. There is no build command and no output subfolder to select for direct upload. The supplied `_headers` and `_redirects` files belong at the root.
4. Connect your custom domain in Cloudflare Pages settings when ready.

The contact form uses a `mailto:` draft in the visitor's email application. It does not store or send a submission from a server, and it does not require a Worker, Firebase, or Cloudflare R2. The visitor must click Send inside their own email app. The embedded school map is a Google Maps **search**, not a verified exact entrance marker; visitors can call to confirm directions.

Video files in `assets/media/` are silent H.264 MP4s. Posters are provided for browsers that block autoplay. The two videos can be replaced later with the source MP4s without changing the page structure; keep their existing filenames, or update the matching `<source>` references.

## October 14 adjustments

- Homepage headline now reads **Small school. Big days.** and the redundant scroll strip was removed.
- Photo carousel uses three sequences of the same cards, resetting at matching visual positions for continuous swipe and autoplay rather than jumping to the first card visibly.
- Heading widths and line arrangement revised for phone and desktop screens across Home, Our Story, Learning, Our People, School Life and Admissions.
- Both homepage video cards now use equal landscape-style containers with object-fit framing suited to their respective portrait and landscape sources.
- Teacher cards were reordered by qualifications, beginning with Kalyani Singh, while the teacher-profile modal retains the correct data mapping.
- Contact page simplifies the introduction and removes the checkbox and extra instructions, with a map search and concise mail-draft notice.
- One similar outdoor group image was dropped from Photo Journal; the gallery lightbox numbering was reindexed.
- School-life staff copy appears before its team photograph on narrow screens.

## QA scope

- Browser-rendered **screenshots of all eight main pages** were taken at phone (390px) and desktop (1440px) sizes. For QA, the source HTML and local images/scripts/styles were embedded into Chromium because the runtime blocks navigation to local/loopback URLs. This permits layout checks but does not replicate live network resources.
- Additional responsive layout checks at 320px, 360px, 440px, 768px and 1024px found no page-width overflow. Required headings were checked for the intended number of lines.
- The homepage carousel was advanced repeatedly across its seam. The first repeated card follows the last continuously, with scroll position normalized only at the equivalent visual position.
- All local HTML asset paths resolve. JavaScript syntax passes. Both silent MP4s are H.264 and verified without audio tracks.
- **Before production launch**, test on at least one real Android/iOS browser and verify the embedded Google Maps search externally. The school's precise entrance/pin is not claimed verified. Also test autoplay and the user's installed email app, which browser-only emulation cannot fully verify.

The media in `assets/` belongs in the website package. The local `QA/` folder and editing scripts are not needed for deployment and are excluded from the ZIP.
