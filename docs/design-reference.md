# Two Element Media motion design

Particle reference: https://openai.com/index/gpt-6-astra/

The reference's dark, luminous particle field informs the motion treatment. This implementation samples the white pixels of the supplied official Two Element Media logo into 5,170 fragments (2,585 on compact canvases). It does not use generated graphics, a substituted logo, or the reference site's code/assets.

One reversible scroll timeline spans the four site chapters. The particles start dispersed with depth variation, follow curved paths towards their positions, then crossfade into the original logo at the end to preserve its fine details. Pointer movement adds restrained depth while the pieces are dispersed. The field stays beside the desktop content and in a compact sticky strip on mobile. Reduced-motion settings show the resolved logo.

Rendering is event-driven with requestAnimationFrame coalescing. There is no perpetual animation loop. Pixel density is capped at 2; compact views halve the particle count. Resize, pointer and visibility listeners, image callbacks and pending frames are cleaned up on unmount.

The original logo file remains unchanged at `public/images/two-element-official.png`.

Verification: ESLint and production build. Browser checks cover initial field, intermediate convergence, final original logo, mobile layout at 390×844, scroll reversal, navigation, no horizontal overflow and production console output.
