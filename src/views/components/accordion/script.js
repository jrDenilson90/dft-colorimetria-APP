document.querySelectorAll('.accordionComponent .accordion-title').forEach(function (label) {
    label.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            label.click(); // Simula o clique, abrindo/fechando o accordion
        }
    });
});