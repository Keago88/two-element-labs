# Two Element Media design

The four-chapter navigation and typographic scale were adapted from the FREY reference: https://dribbble.com/shots/22680408-FREY-3D-Agency-Website-Animation

The generated 3D props, decorative technical labels, grids and generic agency slogans have been removed. The site now uses service-led typography, plain descriptions, the existing Cape Town photograph and the supplied official logo. Mobile and reduced-motion layouts use vertical scrolling.

The supplied logo is unchanged at `public/images/two-element-official.png`.

## Continuous parallax assembly

Four CSS-clipped portions of the unchanged official logo begin at different positions, rotations and scales. One scroll timeline gradually brings all four into their original alignment. The brand name appears as the logo resolves at the contact chapter. Scrolling backwards reverses the assembly; there are no autoplay loops or generated images.

The artwork stays in a separate column on desktop, and in a compact sticky strip on mobile. Chapter transitions are clipped to the content column to prevent text crossing the artwork. Reduced-motion settings use the completed logo and vertical content.

Verified in-browser at 1280×720, 1024×650 and 390×844: scattered start, intermediate alignment, exact identity transforms at the end, mobile sticky positioning, no horizontal overflow, service enquiry selection and clean console. Lint and production build pass.
