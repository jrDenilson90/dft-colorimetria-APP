document.querySelectorAll('.flipcards-container[data-flip-type="click"] .flipcard').forEach(function (card) {
    card.addEventListener('click', function () {
        card.classList.toggle('flipped');
    });
    // Acessibilidade: flip via Enter/Espaço
    card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.classList.toggle('flipped');
        }
    });
});
