const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const htmlmin = require('gulp-htmlmin');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const del = require('del');
const replace = require('gulp-replace');
const babel = require('gulp-babel');
const wrap = require('gulp-wrap');
const through = require('through2');
const cheerio = require('gulp-cheerio');
const flatten = require('gulp-flatten');

// Importa os caminhos dos scripts do imports.js
const scriptPaths = require('./src/script/imports.js');

// Caminhos
const paths = {
    pug: {
        src: 'src/index.pug',
        dest: 'dist/'
    },
    sass: {
        src: 'src/**/main.scss',
        watch: 'src/**/*.scss',
        dest: 'dist'
    },
    js: {
        dest: 'dist/js/'
    },
    externalJs: {
        src: 'src/scriptExternal/**/*.js',
        dest: 'dist/external/'
    },
    production: {
        dest: 'bob/'
    }
};

// Tarefa para limpar a pasta dist
gulp.task('clean', () => {
    return del(['dist/**', '!dist']);
});

// Compilar Pug para HTML
gulp.task('pug', () => 
    gulp.src(paths.pug.src)
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest(paths.pug.dest))
        .pipe(browserSync.stream())
);

// Compilar e minificar Sass para CSS
gulp.task('sass', () => 
    gulp.src(paths.sass.src)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.sass.dest))
        .pipe(browserSync.stream())
);

// Compilar, concatenar e envolver apenas os JS do imports.js
gulp.task('js', () => 
    gulp.src([
        ...scriptPaths.main,
        ...scriptPaths.templates,
        ...scriptPaths.components,
        'src/view/**/*.js'
    ])
    .pipe(through.obj((file, enc, cb) => {
        console.log('Processing file:', file.path);
        cb(null, file);
    }))
    .pipe(sourcemaps.init())
    .pipe(babel({
        presets: ['@babel/preset-env']
    }))
    .pipe(concat('main.js'))
    .pipe(wrap('document.addEventListener("DOMContentLoaded", function() { <%= contents %> });'))
    // .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browserSync.stream())
);

// Minificar e concatenar JavaScript externo
gulp.task('externalJs', () => 
    gulp.src(paths.externalJs.src)
        .pipe(sourcemaps.init())
        .pipe(concat('external.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.externalJs.dest))
        .pipe(browserSync.stream())
);

// <======================= INICIO TASK PARA GERAR ARQUIVOS PARA O BOB ===========================>

gulp.task('clean-production', () => {
    return del(['producao/**', '!producao']);
});

gulp.task('html-production', () => 
    gulp.src('dist/*.html')
        .pipe(cheerio({
            run: function ($) {
                const dafitiContent = $('.dafitiStructure').html();
                $.root().html(`<div class="dafitiStructure">${dafitiContent}</div>`);
            },
            parserOptions: { xmlMode: false }
        }))
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(gulp.dest(paths.production.dest))
);

gulp.task('css-production', () => 
    gulp.src('dist/**/*.css')
        .pipe(through.obj((file, enc, cb) => {
            const cssContent = file.contents.toString(enc);
            const wrappedContent = 
                `<style>
                    .catalog-banner-full-container,
                    .catalog-page,
                    .l-container {
                    margin-top: 0;
                    }
                    .l-full-content.l-container {
                    max-width: 100%;
                    min-width: 100%;
                    }
                    .container.catalog-page {
                    padding: 0;
                    width: 100%;
                    }
                    .content-products-list.row,
                    .clearfix:not(.l-catalog-header, .catalog-banner-full, .menu-group) {
                    max-width: 960px;
                    margin: auto;
                    }
                    .catalog-row-filters.row {
                    max-width: fit-content;
                    }
                    .catalog-breadcrumb,
                    .after-header-overflow,
                    #ad-placements {
                    display: none !important;
                    }
                    ${cssContent}
                </style>`;
            file.contents = Buffer.from(wrappedContent, enc);
            cb(null, file);
        }))
        .pipe(flatten())
        .pipe(gulp.dest(paths.production.dest))
);

gulp.task('compact-css', () => 
    gulp.src('bob/*.css')
        .pipe(replace(/\s+/g, ' '))
        .pipe(replace(/\s*{\s*/g, '{'))
        .pipe(replace(/\s*}\s*/g, '}'))
        .pipe(replace(/\s*:\s*/g, ':'))
        .pipe(replace(/\s*;\s*/g, ';'))
        .pipe(gulp.dest('bob'))
);

gulp.task('js-production', () => 
    gulp.src('dist/js/**/*.js')
        .pipe(uglify())
        .pipe(through.obj((file, enc, cb) => {
            const jsContent = file.contents.toString(enc);
            const wrappedContent = `<script>${jsContent}</script>`;
            file.contents = Buffer.from(wrappedContent, enc);
            cb(null, file);
        }))
        .pipe(gulp.dest(paths.production.dest))
);

// <======================== FIM TASK PARA GERAR ARQUIVOS PARA O BOB ============================>

// Servidor e observador de arquivos
gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: './dist'
        }
    });

    gulp.watch('src/**/*.pug', gulp.series('pug'));
    gulp.watch(paths.sass.watch, gulp.series('sass', 'compact-css'));
    gulp.watch([
        ...scriptPaths.main,
        ...scriptPaths.templates,
        ...scriptPaths.components
    ], gulp.series('js'));
    gulp.watch(paths.externalJs.src, gulp.series('externalJs'));
    gulp.watch('./src/script/imports.js', gulp.series('js'));
});

// Tarefa de build para compilar todos os arquivos após limpar
gulp.task('build', gulp.series('clean', 'pug', 'sass', 'js', 'externalJs'));

// Definir a tarefa 'watch' para observar mudanças e iniciar o servidor
gulp.task('watch', gulp.series('serve'));

// Tarefa de build para produção
gulp.task('build-production', gulp.series('clean-production', 'html-production', 'css-production', 'compact-css', 'js-production'));