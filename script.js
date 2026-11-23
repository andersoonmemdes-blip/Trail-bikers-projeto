"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navList = document.querySelector(".nav-list");
const brandLink = document.querySelector(".link-brand");
const main = document.querySelector(".conteudo");
const mobileMenu = window.matchMedia("(width < 48rem)");

function setMenuOpen(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    navList.inert = mobileMenu.matches && !open;
    brandLink.inert = open;
    main.inert = open;
}

function updateMenuLayout() {
    const focusedInNav = navList.contains(document.activeElement);
    const focusedOnToggle = document.activeElement === menuToggle;

    menuToggle.hidden = !mobileMenu.matches;
    setMenuOpen(false);

    if (mobileMenu.matches && focusedInNav) {
        menuToggle.focus({ preventScroll: true });
    } else if (!mobileMenu.matches && focusedOnToggle) {
        navList.querySelector("a").focus({ preventScroll: true });
    }
}

menuToggle.addEventListener("click", () => {
    const opening = menuToggle.getAttribute("aria-expanded") === "false";
    setMenuOpen(opening);
    menuToggle.focus({ preventScroll: true });
});

navList.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || menuToggle.getAttribute("aria-expanded") !== "true") return;

    setMenuOpen(false);

    const target = document.getElementById(link.hash.slice(1));
    (target || menuToggle).focus({ preventScroll: true });
});

document.addEventListener("keydown", (event) => {
    if (menuToggle.getAttribute("aria-expanded") !== "true") return;

    if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuToggle.focus({ preventScroll: true });
    }

    if (event.key === "Tab") {
        const lastLink = navList.querySelector("li:last-child a");
        if (event.shiftKey && document.activeElement === menuToggle) {
            event.preventDefault();
            lastLink.focus();
        } else if (!event.shiftKey && document.activeElement === lastLink) {
            event.preventDefault();
            menuToggle.focus({ preventScroll: true });
        }
    }
});

updateMenuLayout();
mobileMenu.addEventListener("change", updateMenuLayout);

const { gsap, ScrollTrigger } = window;

if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const cardContainer = document.querySelector(".card-container");
    const cards = Array.from(cardContainer.children);
    const breakpoints = gsap.matchMedia();

    breakpoints.add("(width < 48rem) and (min-height: 34rem) and (prefers-reduced-motion: no-preference)", () => {
        cardContainer.dataset.stack = "";
        gsap.set(cards, { "--stack-offset": (index) => `${index * 10}px` });

        // Libera espaço para o último card alcançar o topo antes do contato.
        const lastCard = cards.at(-1);
        function updateStackSpace() {
            const top = parseFloat(getComputedStyle(lastCard).top);
            const space = Math.max(0, window.innerHeight - top - lastCard.offsetHeight);
            cardContainer.style.setProperty("--stack-space", `${space}px`);
        }

        updateStackSpace();
        const resizeObserver = new ResizeObserver(() => {
            updateStackSpace();
            ScrollTrigger.refresh(true);
        });
        cards.forEach((card) => resizeObserver.observe(card));
        window.addEventListener("resize", updateStackSpace);

        cards.slice(0, -1).forEach((card, index) => {
            const nextCard = cards[index + 1];
            function nextCardStackPosition() {
                // Usa a posição no grid, que não muda quando os cards ficam sticky.
                const gap = parseFloat(getComputedStyle(cardContainer).rowGap);
                const previousRows = cards.slice(0, index + 1);
                const offset = previousRows.reduce((sum, item) => sum + item.offsetHeight + gap, 0);
                return cardContainer.getBoundingClientRect().top + window.scrollY
                    + offset - parseFloat(getComputedStyle(nextCard).top);
            }

            gsap.to(card, {
                scale: 0.95,
                ease: "none",
                scrollTrigger: {
                    start: () => nextCardStackPosition() - 160,
                    end: nextCardStackPosition,
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });
        });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateStackSpace);
            delete cardContainer.dataset.stack;
            cardContainer.style.removeProperty("--stack-space");
        };
    });
}
