document.querySelectorAll('.component-lineImage a').forEach(function(link) {
    const img = link.querySelector('img');
    if (img && img.alt) {
        link.setAttribute(
            'aria-label',
            img.alt + ' — ao clicar você será direcionado para outra página'
        );
    }
});