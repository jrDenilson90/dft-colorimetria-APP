// BRAZE
window.addEventListener('ab.BridgeReady', function() {
    // brazeBridge.getUser().setCustomUserAttribute("favorite color", "blue");

    var bridge = window.braze || window.brazeBridge || window.appboyBridge;

    function track(eventName) {
        try { bridge && bridge.logCustomEvent && bridge.logCustomEvent(eventName); } catch (e) { }
    }

    function closeMsg() {
        try { bridge && bridge.closeMessage && bridge.closeMessage(); } catch (e) { }
    }

    function wireHandlers() {
        var btnIniciarTeste = document.querySelector('.iniciarTeste');
        var feedbacksViews = document.querySelectorAll('[data-content-id]');

        if (btnIniciarTeste) {
            btnIniciarTeste.addEventListener('click', function (e) {
                track('iniciou_teste_colorimetria');
            });
        }

        feedbacksViews.forEach(function (el) {
            el.addEventListener('click', function (e) {
                var raw = el.getAttribute('data-content-id') || '';
                var eventName = raw.toLowerCase().replace(/[^\w]+/g, '_');
                track(eventName);

                if (el.tagName === 'A' && el.href) {
                    e.preventDefault();
                    // opcional: pequeno delay para garantir envio antes de fechar/navegar
                    setTimeout(function () {
                        try { window.location = el.href; } catch (e) { }
                        closeMsg();
                    }, 50);
                } else {
                    closeMsg();
                }
            });
        });
    }

    // View (opcional)
    // try { bridge && bridge.logCustomEvent && bridge.logCustomEvent('iam_feedback_view'); } catch (e) { }

    wireHandlers();
});

// Função para marcar o slide central e vizinhos
function marcarSlides(slider) {
    const slides = Array.from(slider.container.querySelectorAll('.keen-slider__slide'));
    slides.forEach(slide => {
        slide.classList.remove('slide-center', 'slide-left', 'slide-right');
    });

    const center = slider.track.details.rel;
    const total = slides.length;

    // Marcar o central
    const centerSlide = slides.find(slide => Number(slide.dataset.slideIdx) === center);
    if (centerSlide) centerSlide.classList.add('slide-center');

    // Marcar o da esquerda (loop)
    let leftIdx = center - 1;
    if (leftIdx < 0) leftIdx = total - 1;
    const leftSlide = slides.find(slide => Number(slide.dataset.slideIdx) === leftIdx);
    if (leftSlide) leftSlide.classList.add('slide-left');

    // Marcar o da direita (loop)
    let rightIdx = center + 1;
    if (rightIdx >= total) rightIdx = 0;
    const rightSlide = slides.find(slide => Number(slide.dataset.slideIdx) === rightIdx);
    if (rightSlide) rightSlide.classList.add('slide-right');
}

// Função de navegação do Keen Slider (sem dots)
function navigation(slider) {
    let wrapper, arrowLeft, arrowRight

    function markup(remove) {
        wrapperMarkup(remove)
        arrowMarkup(remove)
    }

    function removeElement(elment) {
        if (elment && elment.parentNode) elment.parentNode.removeChild(elment)
    }
    function createDiv(className) {
        var div = document.createElement("div")
        var classNames = className.split(" ")
        classNames.forEach((name) => div.classList.add(name))
        return div
    }

    function arrowMarkup(remove) {
        if (remove) {
            removeElement(arrowLeft)
            removeElement(arrowRight)
            return
        }
        arrowLeft = createDiv("arrow arrow--left")
        arrowLeft.addEventListener("click", () => slider.prev())
        arrowRight = createDiv("arrow arrow--right")
        arrowRight.addEventListener("click", () => slider.next())

        wrapper.appendChild(arrowLeft)
        wrapper.appendChild(arrowRight)
    }

    function wrapperMarkup(remove) {
        if (remove) {
            var parent = wrapper.parentNode
            while (wrapper.firstChild)
                parent.insertBefore(wrapper.firstChild, wrapper)
            removeElement(wrapper)
            return
        }
        wrapper = createDiv("navigation-wrapper")
        slider.container.parentNode.appendChild(wrapper)
        wrapper.appendChild(slider.container)
    }

    function updateClasses() {
        var slide = slider.track.details.rel
        slide === 0
            ? arrowLeft.classList.add("arrow--disabled")
            : arrowLeft.classList.remove("arrow--disabled")
        slide === slider.track.details.slides.length - 1
            ? arrowRight.classList.add("arrow--disabled")
            : arrowRight.classList.remove("arrow--disabled")
        // Chama marcarSlides sempre que atualizar as setas
        marcarSlides(slider);
    }

    slider.on("created", () => {
        markup()
        updateClasses()
    })
    slider.on("optionsChanged", () => {
        markup(true)
        markup()
        updateClasses()
    })
    slider.on("slideChanged", () => {
        updateClasses()
    })
    slider.on("destroyed", () => {
        markup(true)
    })
}

// Função para animar a barra de progresso
function animarBarraProgresso(barra, percentFinal) {
    let percentAtual = parseFloat(barra.style.width) || 0;
    percentFinal = Math.max(0, Math.min(100, percentFinal));
    if (percentAtual === percentFinal) return;

    const passo = percentFinal > percentAtual ? 1 : -1;
    const anim = setInterval(() => {
        percentAtual += passo;
        barra.style.width = percentAtual + '%';
        if ((passo > 0 && percentAtual >= percentFinal) || (passo < 0 && percentAtual <= percentFinal)) {
            barra.style.width = percentFinal + '%';
            clearInterval(anim);
        }
    }, 20);
}

// Função para animar o texto do progresso
function animarTextoProgresso(texto, percentFinal) {
    // Cancela qualquer animação anterior
    if (texto._animInterval) {
        clearInterval(texto._animInterval);
        texto._animInterval = null;
    }
    let percentAtual = parseInt(texto.textContent) || 0;
    percentFinal = Math.max(0, Math.min(100, percentFinal));
    if (percentAtual === percentFinal) return;

    const passo = percentFinal > percentAtual ? 1 : -1;
    texto._animInterval = setInterval(() => {
        percentAtual += passo;
        texto.textContent = percentAtual + '%';
        if ((passo > 0 && percentAtual >= percentFinal) || (passo < 0 && percentAtual <= percentFinal)) {
            texto.textContent = percentFinal + '%';
            clearInterval(texto._animInterval);
            texto._animInterval = null;
        }
    }, 20);
}

// Função para atualizar todas as barras de progresso do quiz
function atualizarBarraProgresso(quiz, questions, qIndex, force100, animarTexto = false) {
    // Se o quiz foi finalizado, trava a barra e o texto em 100%
    if (quiz.quizFinalizado || force100) {
        quiz.querySelectorAll('.borraProgress .avanco').forEach(barra => {
            // Só anima se não estiver em 100%
            if (parseFloat(barra.style.width) !== 100) {
                animarBarraProgresso(barra, 100);
            } else {
                barra.style.width = '100%';
            }
        });
        quiz.querySelectorAll('.borraProgress .textAvanco').forEach(texto => {
            // Cancela qualquer animação anterior
            if (texto._animInterval) {
                clearInterval(texto._animInterval);
                texto._animInterval = null;
            }
            if (animarTexto && parseInt(texto.textContent) !== 100) {
                animarTextoProgresso(texto, 100);
            } else {
                texto.textContent = '100%';
            }
            texto.style.color = '#ffffff';
        });
        return;
    }

    const temPerguntaBonus = questions.length > 1 && questions[questions.length - 1].classList.contains('bonus');
    let totalPerguntas = temPerguntaBonus ? questions.length - 1 : questions.length;

    if (temPerguntaBonus && qIndex === questions.length - 1) {
        totalPerguntas = questions.length;
    }
    let percent;
    const quizId = quiz.getAttribute('data-quiz-id') || 'quiz';
    let respostas = JSON.parse(localStorage.getItem(quizId + '_buzzFeedRespostas') || '[]');
    if (respostas.length < questions.length) {
        respostas = Array(questions.length).fill(null).map((_, i) => respostas[i] || null);
    }
    let respondidas = respostas.filter(r => r !== null).length;

    if (temPerguntaBonus) {
        // Só bate 100% após responder a bônus
        const respondeuBonus = respostas[questions.length - 1] !== null;
        const respondidasNormais = respostas.slice(0, totalPerguntas).filter(r => r !== null).length;
        if (!respondeuBonus) {
            // Se todas as normais respondidas, barra para em (totalPerguntas/questions.length)*100
            if (respondidasNormais === totalPerguntas) {
                percent = Math.floor(100 * (totalPerguntas / questions.length));
            } else {
                percent = Math.round((respondidasNormais / questions.length) * 100);
            }
        } else {
            percent = 100;
        }
    } else {
        if (respondidas >= totalPerguntas) {
            percent = 100;
        } else {
            percent = Math.round((respondidas / totalPerguntas) * 100);
        }
    }
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;

    quiz.querySelectorAll('.borraProgress .avanco').forEach(barra => {
        animarBarraProgresso(barra, percent);
    });

    quiz.querySelectorAll('.borraProgress .textAvanco').forEach(texto => {
        if (animarTexto) {
            animarTextoProgresso(texto, percent);
        } else {
            texto.textContent = percent + '%';
        }
        if (percent > 0) {
            texto.style.color = '#ffffff'
        }
    });
}

const triggers = document.querySelectorAll('.iniciarTeste');
const quiz = document.querySelector('.quiz');
const capa = document.querySelector('.capa');

triggers.forEach(btn => {
    btn.addEventListener('click', function (e) {
        quiz.classList.remove('hide');
        capa.classList.add('hide');

        document.querySelectorAll('.buzzfeed-quiz').forEach(function (quiz) {
            let resultadoAberto = false;
            let bonusAtiva = false; // FLAG PARA SABER SE A BONUS ESTÁ ATIVA
            quiz.quizFinalizado = false; // FLAG associada ao elemento quiz

            const quizId = quiz.getAttribute('data-quiz-id') || 'quiz';
            const respostasKey = `${quizId}_buzzFeedRespostas`;
            const resultadoKey = `${quizId}_buzzFeedResultado`;
            const pontuacaoKey = `${quizId}_quizPontuacaoBuzzFeed`;

            const questions = Array.from(quiz.querySelectorAll('.quiz-question'));
            const temPerguntaBonus = questions.length > 1 && questions[questions.length - 1].classList.contains('bonus');

            // Garante que a pergunta bônus está oculta no início
            questions.forEach((q, i) => {
                if (q.classList.contains('bonus')) {
                    q.style.display = 'none';
                }
            });

            // Inicializa o texto da barra de progresso em 0%
            quiz.querySelectorAll('.borraProgress .textAvanco').forEach(texto => {
                texto.textContent = '0%';
                texto.style.color = '#88593D';
            });

            let perguntasLiberadas = new Set();
            perguntasLiberadas.add(0);

            let feedbacksSet = new Set();
            questions.forEach(q => {
                q.querySelectorAll('.quiz-option').forEach(opt => {
                    feedbacksSet.add(opt.getAttribute('data-feedback'));
                });
            });
            const pontuacaoBuzzFeed = {};
            feedbacksSet.forEach(feed => pontuacaoBuzzFeed[feed] = 0);

            localStorage.removeItem(respostasKey);
            localStorage.removeItem(resultadoKey);
            localStorage.removeItem(pontuacaoKey);

            const keenSliders = {};

            function inicializarSlider(qIndex) {
                if (!keenSliders[qIndex]) {
                    const sliderEl = questions[qIndex].querySelector('.quiz-options.keen-slider');
                    if (sliderEl) {
                        keenSliders[qIndex] = new KeenSlider(sliderEl, {
                            loop: true,
                            mode: "free",
                            slides: {
                                origin: "center",
                                perView: 1.8,
                                spacing: 10,
                            },
                            breakpoints: {
                                "(max-width: 1000px)": {
                                    slides: {
                                        origin: "center",
                                        perView: 1.8,
                                        spacing: 8,
                                    }
                                }
                            }
                        }, [navigation]);
                    }
                }
            }

            function getEmpatados(pontuacao) {
                const max = Math.max(...Object.values(pontuacao));
                return Object.keys(pontuacao).filter(feed => pontuacao[feed] === max);
            }

            function mostrarPergunta(qIndex, forceShowBonus = false) {
                questions.forEach((q, i) => {
                    if (q.classList.contains('bonus')) {
                        q.style.display = ((bonusAtiva && qIndex === questions.length - 1) || forceShowBonus) ? 'block' : 'none';
                    } else {
                        if (bonusAtiva) {
                            if (i === questions.length - 2 && qIndex === i) {
                                q.style.display = 'block';
                            } else {
                                q.style.display = (i === qIndex && qIndex !== questions.length - 1) ? 'block' : 'none';
                            }
                        } else {
                            q.style.display = (i === qIndex) ? 'block' : 'none';
                        }
                    }
                });
                inicializarSlider(qIndex);

                const titulo = questions[qIndex].querySelector('h3[tabindex="0"]');
                if (titulo) {
                    setTimeout(() => titulo.focus(), 100);
                }

                perguntasLiberadas.add(qIndex);

                let respostas = JSON.parse(localStorage.getItem(respostasKey) || '[]');
                const options = questions[qIndex].querySelectorAll('.quiz-option');
                if (respostas[qIndex]) {
                    const { optionIndex } = respostas[qIndex];
                    options.forEach((opt, idx) => {
                        if (idx === optionIndex) {
                            opt.checked = true;
                            opt.closest('label').classList.add('selected');
                        } else {
                            opt.checked = false;
                            opt.closest('label').classList.remove('selected');
                        }
                    });
                } else {
                    options.forEach(opt => {
                        opt.checked = false;
                        opt.closest('label').classList.remove('selected');
                    });
                }
                atualizarNavegacao(qIndex);
                atualizarBarraProgresso(quiz, questions, qIndex, false, false); // NÃO anima ao navegar

                // Adiciona acessibilidade de teclado para os labels das opções visíveis
                questions[qIndex].querySelectorAll('.keen-slider__slide[tabindex="0"]').forEach(label => {
                    label.addEventListener('keydown', function (e) {
                        if (e.key === ' ' || e.key === 'Enter') {
                            const input = label.querySelector('input');
                            if (input && !input.disabled) {
                                input.checked = !input.checked;
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                            e.preventDefault();
                        }
                    });
                });
            }

            function mostrarPerguntaDesempate(pergunta, empatados) {
                bonusAtiva = true;
                mostrarPergunta(questions.length - 1);
                pergunta.querySelectorAll('.quiz-option').forEach(opt => {
                    const feed = opt.getAttribute('data-feedback');
                    if (empatados.includes(feed)) {
                        opt.closest('label').style.display = '';
                    } else {
                        opt.closest('label').style.display = 'none';
                        opt.checked = false;
                        opt.closest('label').classList.remove('selected');
                    }
                });
                inicializarSlider(questions.length - 1);
                atualizarBarraProgresso(quiz, questions, questions.length - 1, false, false);
            }

            function atualizarNavegacao(qIndex) {
                let respostas = JSON.parse(localStorage.getItem(respostasKey) || '[]');
                const prevBtn = questions[qIndex].querySelector('.prev-btn');
                const nextBtn = questions[qIndex].querySelector('.next-btn');
                if (prevBtn) {
                    prevBtn.disabled = !(qIndex > 0 && perguntasLiberadas.has(qIndex - 1));
                }
                if (nextBtn) {
                    nextBtn.disabled = !(qIndex < questions.length - 1 && perguntasLiberadas.has(qIndex + 1));
                }
            }

            questions.forEach((question, qIndex) => {
                const options = question.querySelectorAll('.quiz-option');
                const prevBtn = question.querySelector('.prev-btn');
                const nextBtn = question.querySelector('.next-btn');

                atualizarNavegacao(qIndex);

                options.forEach(opt => {
                    opt.addEventListener('change', function () {
                        options.forEach(o => o.closest('label').classList.remove('selected'));
                        if (opt.checked) {
                            opt.closest('label').classList.add('selected');
                        }

                        const checked = question.querySelector('.quiz-option:checked');
                        if (!checked) return;

                        let respostas = JSON.parse(localStorage.getItem(respostasKey) || '[]');
                        if (respostas.length < questions.length) {
                            respostas = Array(questions.length).fill(null);
                        }

                        const optionIndex = Array.from(question.querySelectorAll('.quiz-option')).indexOf(checked);
                        const feedback = checked.getAttribute('data-feedback');

                        if (respostas[qIndex] && pontuacaoBuzzFeed.hasOwnProperty(respostas[qIndex].feedback)) {
                            pontuacaoBuzzFeed[respostas[qIndex].feedback]--;
                        }

                        if (pontuacaoBuzzFeed.hasOwnProperty(feedback)) {
                            pontuacaoBuzzFeed[feedback]++;
                        }
                        respostas[qIndex] = { feedback, optionIndex };

                        localStorage.setItem(respostasKey, JSON.stringify(respostas));

                        const isBonus = question.classList.contains('bonus');
                        const isLastNormal = qIndex === (temPerguntaBonus ? questions.length - 2 : questions.length - 1);

                        if (!isLastNormal && !isBonus) {
                            question.style.display = 'none';
                        }

                        atualizarNavegacao(qIndex);
                        atualizarBarraProgresso(quiz, questions, qIndex, false, true); // ANIMA ao responder

                        if (isLastNormal && !isBonus) {
                            const empatados = getEmpatados(pontuacaoBuzzFeed);
                            if (temPerguntaBonus && empatados.length > 1) {
                                mostrarPerguntaDesempate(questions[questions.length - 1], empatados);
                                return;
                            } else {
                                showResult(false);
                                return;
                            }
                        }

                        if (isBonus) {
                            options.forEach(opt => {
                                opt.disabled = true;
                                opt.closest('label').style.pointerEvents = 'none';
                            });
                            showResult(true);
                            return;
                        }

                        if (qIndex + 1 < (temPerguntaBonus ? questions.length - 1 : questions.length)) {
                            mostrarPergunta(qIndex + 1);
                        }
                    });
                });

                if (prevBtn) {
                    prevBtn.addEventListener('click', function () {
                        if (qIndex > 0 && perguntasLiberadas.has(qIndex - 1)) {
                            mostrarPergunta(qIndex - 1);
                            atualizarBarraProgresso(quiz, questions, qIndex - 1, false, false); // NÃO anima ao navegar
                        }
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', function () {
                        if (qIndex < questions.length - 1 && perguntasLiberadas.has(qIndex + 1)) {
                            mostrarPergunta(qIndex + 1);
                            atualizarBarraProgresso(quiz, questions, qIndex + 1, false, false); // NÃO anima ao navegar
                        }
                    });
                }
            });

            function showResult(showBonus) {
                let max = -1, result = '';
                for (const [key, value] of Object.entries(pontuacaoBuzzFeed)) {
                    if (value > max) {
                        max = value;
                        result = key;
                    }
                }

                quiz.querySelectorAll('.quiz-modal').forEach(modal => modal.style.display = 'none');
                const modal = quiz.querySelector('.quiz-modal.feedback-' + result);
                if (modal) {
                    modal.style.display = 'flex';
                    setTimeout(() => {
                        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Foca no h4 do feedback/modal
                        const h4 = modal.querySelector('h4');
                        if (h4) h4.setAttribute('tabindex', '-1'); // Garante que pode receber foco
                        if (h4) h4.focus();
                    }, 500);
                }

                localStorage.setItem(resultadoKey, result);
                localStorage.setItem(pontuacaoKey, JSON.stringify(pontuacaoBuzzFeed));

                resultadoAberto = true;
                quiz.quizFinalizado = true;

                questions.forEach(q => {
                    q.querySelectorAll('.quiz-option').forEach(opt => {
                        opt.disabled = true;
                        opt.closest('label').style.pointerEvents = 'none';
                    });
                });

                if (showBonus) {
                    mostrarPergunta(questions.length - 1, true);
                } else {
                    let lastNormal = questions.length - 1;
                    if (questions[lastNormal].classList.contains('bonus')) {
                        lastNormal = questions.length - 2;
                    }
                    mostrarPergunta(lastNormal, false);
                }

                // --- TRAVE AQUI, DEPOIS DE mostrarPergunta ---
                quiz.querySelectorAll('.borraProgress .avanco').forEach(barra => {
                    barra.style.width = '100%';
                });
                quiz.querySelectorAll('.borraProgress .textAvanco').forEach(texto => {
                    texto.textContent = '100%';
                    texto.style.color = '#ffffff';
                });
            }

            quiz.querySelectorAll('.closeModal').forEach(btn => {
                btn.addEventListener('click', function () {
                    quiz.querySelectorAll('.quiz-modal').forEach(modal => modal.style.display = 'none');
                    resultadoAberto = false;
                });
            });

            quiz.querySelectorAll('.refazer').forEach(btn => {
                btn.addEventListener('click', function () {
                    localStorage.removeItem(respostasKey);
                    localStorage.removeItem(resultadoKey);
                    localStorage.removeItem(pontuacaoKey);

                    Object.keys(pontuacaoBuzzFeed).forEach(feed => pontuacaoBuzzFeed[feed] = 0);

                    quiz.querySelectorAll('.quiz-modal').forEach(modal => modal.style.display = 'none');

                    questions.forEach((q, i) => {
                        q.style.display = (i === 0) ? 'block' : 'none';
                        q.querySelectorAll('.quiz-option').forEach(opt => {
                            opt.disabled = false;
                            opt.closest('label').style.pointerEvents = '';
                        });
                        if (q.classList.contains('bonus')) {
                            q.style.display = 'none';
                        }
                    });

                    perguntasLiberadas = new Set();
                    perguntasLiberadas.add(0);

                    bonusAtiva = false;

                    atualizarNavegacao(0);

                    resultadoAberto = false;

                    quiz.quizFinalizado = false;

                    inicializarSlider(0);

                    atualizarBarraProgresso(quiz, questions, 0, false, false);
                });
            });

            atualizarBarraProgresso(quiz, questions, 0, false, false);
            mostrarPergunta(0);
        });
    });
});
