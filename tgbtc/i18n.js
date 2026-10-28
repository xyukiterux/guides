/* Language layer: English (source of truth), Português (Brasil), Español.
   - The guide's prose comes pre-translated at build time (data.pt.js / data.es.js, from guide.pt.json / guide.es.json).
   - Fixed UI strings are translated here: an exact-match table plus patterns for sentences the app builds
     ("3 of 5 owned"). A MutationObserver applies them to every text node and to placeholder / aria-label / title,
     so app.js keeps rendering English and nothing is injected as HTML.
   - Character names, [version tags], numbers and URLs are never in the table, so they never change.
   - In English the layer does nothing but draw the language switch. */
'use strict';
window.TGI18N = (() => {
const LANGS = ['en', 'pt', 'es'], KEY = 'tgbtc-lang';
const NAMES = {en: 'English', pt: 'Português', es: 'Español'};
const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const write = v => { try { localStorage.setItem(KEY, v); return true; } catch (e) { return false; } };
let lang = LANGS.includes(read()) ? read() : 'en';
document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;

/* [English, Português (Brasil), Español] */
const T = [
// header, footer, navigation
['Home','Início','Inicio'],['Start here','Comece aqui','Empieza aquí'],['Best teams','Melhores equipes','Mejores equipos'],
['Meta teams','Equipes meta','Equipos meta'],['Challenges','Desafios','Desafíos'],['What to run','O que usar','Qué usar'],
['What to buy','O que comprar','Qué comprar'],['Tier list','Tier list','Tier list'],['Characters','Personagens','Personajes'],
['Team builder','Montador de equipes','Creador de equipos'],['Boss Lab','Boss Lab','Boss Lab'],['Tools','Ferramentas','Herramientas'],
['More','Mais','Más'],['Teams','Equipes','Equipos'],['Buy','Comprar','Comprar'],['Tiers','Tiers','Tiers'],['Meta','Meta','Meta'],
['My account','Minha conta','Mi cuenta'],['Skip to content','Pular para o conteúdo','Saltar al contenido'],
['GUIDE UPDATED','GUIA ATUALIZADO','GUÍA ACTUALIZADA'],['OCTOBER 27, 2026','27 DE OUTUBRO DE 2026','27 DE OCTUBRE DE 2026'],
['Set your server →','Defina seu servidor →','Elige tu servidor →'],
['UNOFFICIAL FAN PROJECT · LOCAL-FIRST','PROJETO DE FÃ NÃO OFICIAL · SEUS DADOS FICAM NO APARELHO','PROYECTO DE FANS NO OFICIAL · TUS DATOS SE QUEDAN EN TU DISPOSITIVO'],
['Sources and full articles ↗','Fontes e artigos completos ↗','Fuentes y artículos completos ↗'],
['BREAK THE CHAINS / FIELD GUIDE','BREAK THE CHAINS / GUIA','BREAK THE CHAINS / GUÍA'],
['Main navigation','Navegação principal','Navegación principal'],['Mobile navigation','Navegação','Navegación'],
['Loading the guide. If this message remains, extract the entire ZIP before opening dist/index.html.','Carregando o guia. Se esta mensagem continuar, extraia o ZIP inteiro antes de abrir dist/index.html.','Cargando la guía. Si este mensaje sigue, extrae el ZIP completo antes de abrir dist/index.html.'],
// shared
['More details','Mais detalhes','Más detalles'],['Source','Fonte','Fuente'],['Sources','Fontes','Fuentes'],['How to play','Como jogar','Cómo jugar'],
['Open →','Abrir →','Abrir →'],['Full article →','Artigo completo (em inglês) →','Artículo completo (en inglés) →'],
['Read source ↗','Ler fonte ↗','Leer fuente ↗'],['Source needed','Falta fonte','Falta fuente'],['Back-up','Back-up','Back-up'],
['Faction','Facção','Facción'],['All factions','Todas as facções','Todas las facciones'],['All','Todas','Todas'],['Show','Mostrar','Mostrar'],
['Banners','Banners','Banners'],['Banners →','Banners →','Banners →'],['Best teams →','Melhores equipes →','Mejores equipos →'],
['Unknown','Desconhecido','Desconocido'],['Delete','Excluir','Borrar'],
['Skill text on this page is in English, copied from the game files. Everything else is translated.','O texto das skills nesta página está em inglês, copiado dos arquivos do jogo. Todo o resto está traduzido.','El texto de las habilidades en esta página está en inglés, copiado de los archivos del juego. Todo lo demás está traducido.'],
['Star upgrade text on this page is in English, copied from the game files. Everything else is translated.','O texto das melhorias de estrela nesta página está em inglês, copiado dos arquivos do jogo. Todo o resto está traduzido.','El texto de las mejoras de estrella en esta página está en inglés, copiado de los archivos del juego. Todo lo demás está traducido.'],
['Boss skill names and skill text are in English, copied from the game files. The plan and the fight log are translated.','Os nomes e textos das skills dos chefes estão em inglês, copiados dos arquivos do jogo. O plano e o registro de luta estão traduzidos.','Los nombres y textos de las habilidades de los jefes están en inglés, copiados de los archivos del juego. El plan y el registro de pelea están traducidos.'],
['Cell names and effects are in English, copied from the game files. Everything else is translated.','Os nomes e efeitos das cells estão em inglês, copiados dos arquivos do jogo. Todo o resto está traduzido.','Los nombres y efectos de las cells están en inglés, copiados de los archivos del juego. Todo lo demás está traducido.'],
['Recipe names, ingredients and descriptions are in English, copied from the game files. Everything else is translated.','Os nomes, ingredientes e descrições das receitas estão em inglês, copiados dos arquivos do jogo. Todo o resto está traduzido.','Los nombres, ingredientes y descripciones de las recetas están en inglés, copiados de los archivos del juego. Todo lo demás está traducido.'],
['Video titles are shown as their creators wrote them. The summaries are translated.','Os títulos dos vídeos aparecem como os criadores escreveram. Os resumos estão traduzidos.','Los títulos de los videos aparecen como los escribieron sus creadores. Los resúmenes están traducidos.'],

// home
['Know your roster.','Conheça seus personagens.','Conoce a tus personajes.'],['Break the chains.','Quebre as correntes.','Rompe las cadenas.'],
['A guide for every player: what to do first, which teams to build and what to buy.','Um guia para todo jogador: o que fazer primeiro, quais equipes montar e o que comprar.','Una guía para cada jugador: qué hacer primero, qué equipos armar y qué comprar.'],
['Search characters, bosses, guides…','Buscar personagens, chefes, guias…','Buscar personajes, jefes, guías…'],['Search the guide','Buscar no guia','Buscar en la guía'],
['Search →','Buscar →','Buscar →'],['Teams by faction','Equipes por facção','Equipos por facción'],['TOKYO / 20TH WARD','TÓQUIO / 20º DISTRITO','TOKIO / DISTRITO 20'],
['Six steps for a new account','Seis passos para uma conta nova','Seis pasos para una cuenta nueva'],
['Pick your faction: a team for every fight','Escolha sua facção: uma equipe para cada luta','Elige tu facción: un equipo para cada pelea'],
['What should I run?','O que devo usar?','¿Qué debo usar?'],['Tick what you own, get teams','Marque o que você tem e receba equipes','Marca lo que tienes y recibe equipos'],
['The team for each mode and boss','A equipe para cada modo e chefe','El equipo para cada modo y jefe'],
['Top picks, good and skip','Mais indicados, bom e pular','Más recomendados, bueno y saltar'],['121 rated units, S to D','121 unidades avaliadas, de S a D','121 unidades valoradas, de S a D'],
['Tools and library','Ferramentas e biblioteca','Herramientas y biblioteca'],['All 143, with skills','Todos os 143, com habilidades','Los 143, con habilidades'],
['Build and save teams','Monte e salve equipes','Arma y guarda equipos'],['Boss skills and plans','Habilidades e planos dos chefes','Habilidades y planes de jefes'],
['Live banner and history','Banner ativo e histórico','Banner activo e historial'],['Diamond and pull math','Contas de Diamonds e pulls','Cálculos de Diamonds y pulls'],
['Daily plan','Plano diário','Plan diario'],['Checklist and milestones','Checklist e metas','Lista y metas'],
['Popular characters','Personagens populares','Personajes populares'],['Browse all 143 →','Ver todos os 143 →','Ver los 143 →'],
['More to explore','Mais para explorar','Más para explorar'],['Live banner','Banner ativo','Banner activo'],
['Halloween Hinami (limited, 300 pulls) runs October 25 – November 8 on established servers. Free-to-play: skip her unless you play Anteiku.','Halloween Hinami (limitada, 300 pulls) vai de 25 de outubro a 8 de novembro nos servidores antigos. Free-to-play: pule, a menos que você jogue de Anteiku.','Halloween Hinami (limitada, 300 pulls) va del 25 de octubre al 8 de noviembre en los servidores antiguos. Free-to-play: sáltala salvo que juegues Anteiku.'],
['Game modes','Modos de jogo','Modos de juego'],['Walkthroughs for all 14 modes.','Guias passo a passo dos 14 modos.','Guías paso a paso de los 14 modos.'],
['Game modes →','Modos de jogo →','Modos de juego →'],['Coffee and cells','Café e cells','Café y cells'],
['24 coffee recipes and the equipment cells.','24 receitas de café e as cells de equipamento.','24 recetas de café y las cells de equipo.'],
['Coffee','Café','Café'],['Cells','Cells','Cells'],['157 creator videos','157 vídeos de criadores','157 videos de creadores'],
['Search by topic, creator or title.','Busque por tema, criador ou título.','Busca por tema, creador o título.'],['Video library →','Videoteca →','Videoteca →'],
['Your collection','Sua coleção','Tu colección'],['Mark what you own','Marque o que você tem','Marca lo que tienes'],
['Mark your characters and stars, then build teams from them.','Marque seus personagens e estrelas e monte equipes com eles.','Marca tus personajes y estrellas y arma equipos con ellos.'],
['Open your account →','Abrir sua conta →','Abrir tu cuenta →'],
['Guide updated October 27, 2026. Prices as of October 19: check the in-game shop before you spend.','Guia atualizado em 27 de outubro de 2026. Preços de 19 de outubro: confira a loja do jogo antes de gastar.','Guía actualizada el 27 de octubre de 2026. Precios del 19 de octubre: revisa la tienda del juego antes de gastar.'],
['Teams and boss tips: research of October 26, 2026. Game data: EU build of September 22, 2026.','Equipes e dicas de chefes: pesquisa de 26 de outubro de 2026. Dados do jogo: versão EU de 22 de setembro de 2026.','Equipos y consejos de jefes: investigación del 26 de octubre de 2026. Datos del juego: versión EU del 22 de septiembre de 2026.'],
['Banners, prices and availability change by server, so confirm them in your game.','Banners, preços e disponibilidade mudam por servidor; confirme no seu jogo.','Los banners, precios y disponibilidad cambian según el servidor; confírmalos en tu juego.'],
['The old full articles are on the','Os artigos completos antigos (em inglês) estão na','Los artículos completos antiguos (en inglés) están en la'],
['Sources page','página de Fontes','página de Fuentes'],
// start here
['START HERE','COMECE AQUI','EMPIEZA AQUÍ'],['Six steps for a new account.','Seis passos para uma conta nova.','Seis pasos para una cuenta nueva.'],
['Do them in order. Each step has more details if you want them.','Faça na ordem. Cada passo tem mais detalhes, se você quiser.','Hazlos en orden. Cada paso tiene más detalles si los quieres.'],
['How to play: your first days','Como jogar: seus primeiros dias','Cómo jugar: tus primeros días'],
['These steps come from the October 19 article.','Estes passos vêm do artigo de 19 de outubro (em inglês).','Estos pasos vienen del artículo del 19 de octubre (en inglés).'],
['Full article: planner by server day','Artigo completo (em inglês): planejador por dia do servidor','Artículo completo (en inglés): planificador por día del servidor'],
['Full article: early, mid and end game','Artigo completo (em inglês): início, meio e fim de jogo','Artículo completo (en inglés): inicio, mitad y final del juego'],
['Sources and full articles','Fontes e artigos completos','Fuentes y artículos completos'],
// best teams
['BEST TEAMS','MELHORES EQUIPES','MEJORES EQUIPOS'],['The team for each situation.','A equipe para cada situação.','El equipo para cada situación.'],
['Each card shows the best team first, then a free-to-play option. Tap a portrait to open that character.','Cada cartão mostra primeiro a melhor equipe e depois uma opção free-to-play. Toque num retrato para abrir o personagem.','Cada tarjeta muestra primero el mejor equipo y luego una opción free-to-play. Toca un retrato para abrir ese personaje.'],
['Jump to a team','Ir para uma equipe','Ir a un equipo'],['Meta teams by faction','Equipes meta por facção','Equipos meta por facción'],
['The strongest team for each faction, with the order to cast in.','A equipe mais forte de cada facção, com a ordem de uso das habilidades.','El equipo más fuerte de cada facción, con el orden en que lanzar.'],
['Modes','Modos','Modos'],['Bosses','Chefes','Jefes'],['Why this team?','Por que esta equipe?','¿Por qué este equipo?'],
['Attack order','Ordem de ataque','Orden de ataque'],['How to fight this boss','Como lutar contra este chefe','Cómo pelear contra este jefe'],
['Boss skills in the Boss Lab →','Habilidades do chefe no Boss Lab →','Habilidades del jefe en el Boss Lab →'],
['Other bosses: tips only','Outros chefes: só dicas','Otros jefes: solo consejos'],
['The sources give tips, but not a full team, for these bosses.','As fontes dão dicas, mas não uma equipe completa, para estes chefes.','Las fuentes dan consejos, pero no un equipo completo, para estos jefes.'],
['Don’t have one?','Não tem?','¿No lo tienes?'],
// meta teams
['META TEAMS','EQUIPES META','EQUIPOS META'],['Pick your faction.','Escolha sua facção.','Elige tu facción.'],
['Each faction shows its teams for every fight. Your pick is remembered on this device.','Cada facção mostra suas equipes para cada luta. Sua escolha fica salva neste aparelho.','Cada facción muestra sus equipos para cada pelea. Tu elección se guarda en este dispositivo.'],
['Pick a faction','Escolha uma facção','Elige una facción'],['Pick your level','Escolha seu nível','Elige tu nivel'],
['Pick your level. Every unit shows how to get it.','Escolha seu nível. Cada unidade mostra como consegui-la.','Elige tu nivel. Cada unidad muestra cómo conseguirla.'],
['Upgrade path','Caminho de melhoria','Ruta de mejora'],['How the tags work','Como funcionam as etiquetas','Cómo funcionan las etiquetas'],
['Every fight','Cada luta','Cada pelea'],['Tap a fight for its team and attack order.','Toque numa luta para ver a equipe e a ordem de ataque.','Toca una pelea para ver su equipo y su orden de ataque.'],
['No team','Sem equipe','Sin equipo'],['Sourced + not tested','Com fonte + não testado','Con fuente + sin probar'],['Sourced','Com fonte','Con fuente'],
['Not tested','Não testado','Sin probar'],['Sourced team','Equipe com fonte','Equipo con fuente'],
['Full card on Best teams →','Cartão completo em Melhores equipes →','Tarjeta completa en Mejores equipos →'],
['What should I run? →','O que devo usar? →','¿Qué debo usar? →'],['Challenge catalog →','Catálogo de desafios →','Catálogo de desafíos →'],
['Why build all four factions?','Por que montar as quatro facções?','¿Por qué armar las cuatro facciones?'],
['Why you need all four','Por que você precisa das quatro','Por qué necesitas las cuatro'],['A sensible order','Uma ordem sensata','Un orden sensato'],
['Our order (worked out from the sources; no source states it).','Nossa ordem (deduzida das fontes; nenhuma fonte a afirma).','Nuestro orden (deducido de las fuentes; ninguna fuente lo indica).'],
// challenges
['CHALLENGES','DESAFIOS','DESAFÍOS'],['Events with entry rules.','Eventos com regras de entrada.','Eventos con reglas de entrada.'],
['Tap one: who can enter, the team, and how to do it.','Toque em um: quem pode entrar, a equipe e como fazer.','Toca uno: quién puede entrar, el equipo y cómo hacerlo.'],
['Who can enter:','Quem pode entrar:','Quién puede entrar:'],['How to do it, in order','Como fazer, em ordem','Cómo hacerlo, en orden'],
// recommender
['WHAT SHOULD I RUN?','O QUE DEVO USAR?','¿QUÉ DEBO USAR?'],['Tick what you own.','Marque o que você tem.','Marca lo que tienes.'],
['The guide’s teams are ranked by how many of their units you own.','As equipes do guia são ordenadas por quantas unidades delas você tem.','Los equipos de la guía se ordenan según cuántas de sus unidades tienes.'],
['e.g. Nutcracker, Sen, Naki','ex.: Nutcracker, Sen, Naki','p. ej. Nutcracker, Sen, Naki'],
['Type the characters you own','Digite os personagens que você tem','Escribe los personajes que tienes'],['Type names','Digite nomes','Escribe nombres'],
['Add','Adicionar','Añadir'],['Untick all','Desmarcar tudo','Desmarcar todo'],
['Tick each character you own. Your picks are saved with your collection (My account).','Marque cada personagem que você tem. Suas escolhas ficam salvas na sua coleção (Minha conta).','Marca cada personaje que tienes. Tus elecciones se guardan con tu colección (Mi cuenta).'],
['Your best matches','Suas melhores opções','Tus mejores opciones'],
['Tick or type the characters you own to see teams.','Marque ou digite os personagens que você tem para ver equipes.','Marca o escribe los personajes que tienes para ver equipos.'],
['Suggested swap:','Troca sugerida:','Cambio sugerido:'],['No close swap in your roster.','Nenhuma troca parecida entre os seus personagens.','No hay un cambio parecido entre tus personajes.'],
['(sourced)','(com fonte)','(con fuente)'],['(worked out from skills — not tested)','(deduzido das habilidades — não testado)','(deducido de las habilidades — no probado)'],
// buy
['WHAT TO BUY','O QUE COMPRAR','QUÉ COMPRAR'],['Top picks, good, and skip.','Mais indicados, bom e pular.','Más recomendados, bueno y saltar.'],
['Check the in-game shop before you spend.','Confira a loja do jogo antes de gastar.','Revisa la tienda del juego antes de gastar.'],
['Top picks if you spend','Mais indicados, se for gastar','Más recomendados, si gastas'],['Choose screenshots','Escolher capturas','Elegir capturas'],['How to spend','Como gastar','Cómo gastar'],['Good','Bom','Bueno'],['Skip','Não compre','No compres'],
['Gone on older servers','Já saiu nos servidores antigos','Ya no está en servidores antiguos'],['How the value math works','Como funciona a conta de valor','Cómo funciona el cálculo de valor'],
['Full article: pull and spend →','Artigo completo (em inglês): pulls e gastos →','Artículo completo (en inglés): pulls y gastos →'],
// tier list
['TIER LIST','TIER LIST','TIER LIST'],['All 121 rated units, S to D.','As 121 unidades avaliadas, de S a D.','Las 121 unidades valoradas, de S a D.'],
['Tap a unit to see why. “At 0★” means one copy; “At full stars” means fully upgraded.','Toque numa unidade para ver o porquê. “Com 0★” é uma cópia; “Com estrelas máximas” é totalmente melhorada.','Toca una unidad para ver por qué. “Con 0★” es una copia; “Con estrellas máximas” es totalmente mejorada.'],
['Ratings come from the game’s own skill text and stats (EU data of September 22, 2026) plus creator videos. They may lag the October 14 patch.','As notas vêm dos próprios textos de habilidade e atributos do jogo (dados EU de 22 de setembro de 2026) e de vídeos de criadores. Podem não refletir o patch de 14 de outubro.','Las notas salen de los textos de habilidad y estadísticas del propio juego (datos EU del 22 de septiembre de 2026) y de videos de creadores. Pueden no reflejar el parche del 14 de octubre.'],
['Use “At full stars” for the weekly Abyssal Battlefield, which treats your unit as full stars.','Use “Com estrelas máximas” no Abyssal Battlefield semanal, que trata sua unidade como se tivesse todas as estrelas.','Usa “Con estrellas máximas” para el Abyssal Battlefield semanal, que trata tu unidad como si tuviera todas las estrellas.'],
['Attributes: STR beats SKL, SKL beats SPD, SPD beats STR. PSY and WIT beat each other. DST beats every other attribute; only DST beats DST. Some fights switch attribute advantage off.','Atributos: STR vence SKL, SKL vence SPD, SPD vence STR. PSY e WIT vencem um ao outro. DST vence todos os outros atributos; só DST vence DST. Algumas lutas desligam a vantagem de atributo.','Atributos: STR gana a SKL, SKL gana a SPD, SPD gana a STR. PSY y WIT se ganan entre sí. DST gana a todos los demás atributos; solo DST gana a DST. Algunos combates desactivan la ventaja de atributo.'],
['Full article: tier list →','Artigo completo (em inglês): tier list →','Artículo completo (en inglés): tier list →'],
['Rating','Nota','Nota'],['At 0★','Com 0★','Con 0★'],['At full stars','Com estrelas máximas','Con estrellas máximas'],
['Free team','Equipe grátis','Equipo gratis'],['Why (kit numbers)','Por quê (números do kit)','Por qué (números del kit)'],
['Open the codex page →','Abrir a página do personagem →','Abrir la página del personaje →'],
// characters
['CHARACTERS','PERSONAGENS','PERSONAJES'],['All 143 characters.','Todos os 143 personagens.','Los 143 personajes.'],
['Tap one for skills, builds and teams.','Toque em um para ver habilidades, builds e equipes.','Toca uno para ver habilidades, builds y equipos.'],
['The list includes 20 R and SR units that older lists left out.','A lista inclui 20 unidades R e SR que listas antigas deixavam de fora.','La lista incluye 20 unidades R y SR que las listas antiguas dejaban fuera.'],
['Being listed does not prove a character is available on your server today.','Estar na lista não prova que o personagem está disponível no seu servidor hoje.','Estar en la lista no prueba que el personaje esté disponible hoy en tu servidor.'],
['How to build a character','Como montar um personagem','Cómo armar un personaje'],
['Name, variant, alias, skill or ID','Nome, variante, apelido, habilidade ou ID','Nombre, variante, alias, habilidad o ID'],['Filter characters','Filtrar personagens','Filtrar personajes'],
['All rarities','Todas as raridades','Todas las rarezas'],['All attributes','Todos os atributos','Todos los atributos'],
['All characters','Todos os personagens','Todos los personajes'],['Owned','Na coleção','En tu colección'],['Favorites','Favoritos','Favoritos'],
['Missing artwork','Sem arte','Sin arte'],['Announced / placeholder','Anunciado / provisório','Anunciado / provisional'],
['Search roster','Buscar personagens','Buscar personajes'],['Rarity','Raridade','Rareza'],['Attribute','Atributo','Atributo'],['Collection','Coleção','Colección'],
['No matches. Try a different variant or clear a filter.','Nada encontrado. Tente outra variante ou limpe um filtro.','Sin resultados. Prueba otra variante o quita un filtro.'],
['OWNED','NA COLEÇÃO','EN COLECCIÓN'],['Not released yet','Ainda não lançado','Aún no lanzado'],['Character','Personagem','Personaje'],
['Not released','Não lançado','No lanzado'],['Placeholder','Provisório','Provisional'],['Artwork unavailable','Arte indisponível','Arte no disponible'],
// character page
['NOT FOUND','NÃO ENCONTRADO','NO ENCONTRADO'],['Character unavailable.','Personagem indisponível.','Personaje no disponible.'],
['Return to the codex','Voltar aos personagens','Volver a los personajes'],['← Character codex','← Personagens','← Personajes'],
['Mark as owned','Marcar como meu','Marcar como mío'],['This character is not released yet.','Este personagem ainda não foi lançado.','Este personaje aún no ha salido.'],
['★ Favorited','★ Favorito','★ Favorito'],['☆ Favorite','☆ Favoritar','☆ Favorito'],['CHARACTER','PERSONAGEM','PERSONAJE'],
['Attribute unknown','Atributo desconhecido','Atributo desconocido'],['Your star level','Seu nível de estrelas','Tu nivel de estrellas'],
['Character sections','Seções do personagem','Secciones del personaje'],['Overview','Resumo','Resumen'],['Build','Melhorias','Mejoras'],
['How to obtain','Como obter','Cómo obtener'],['Videos','Vídeos','Videos'],['Skills & passives','Habilidades e passivas','Habilidades y pasivas'],
['Game data, September 22, 2026','Dados do jogo, 22 de setembro de 2026','Datos del juego, 22 de septiembre de 2026'],
['Active skill · levels & 6★ change','Habilidade ativa · níveis e mudança no 6★','Habilidad activa · niveles y cambio en 6★'],
['Innate passive','Passiva inata','Pasiva innata'],['1★ passive','Passiva 1★','Pasiva 1★'],['3★ passive','Passiva 3★','Pasiva 3★'],
['4★ power-burst effect','Efeito power-burst 4★','Efecto power-burst 4★'],['2★ Weak effect','Efeito Weak 2★','Efecto Weak 2★'],
['Some numbers are missing from the game text. Check the exact effect in game.','Faltam alguns números no texto do jogo. Confira o efeito exato no jogo.','Faltan algunos números en el texto del juego. Revisa el efecto exacto en el juego.'],
['The full skill text for this character is not available yet.','O texto completo das habilidades deste personagem ainda não está disponível.','El texto completo de habilidades de este personaje aún no está disponible.'],
['At a glance','Visão geral','De un vistazo'],['Not listed','Não informada','Sin indicar'],
['Check in game how to get it on your server.','Confira no jogo como conseguir no seu servidor.','Revisa en el juego cómo conseguirlo en tu servidor.'],
['Rarity note','Nota de raridade','Nota de rareza'],['Fan database entry ↗','Página na base de fãs ↗','Ficha en la base de fans ↗'],
['Game data (EU build of September 22, 2026).','Dados do jogo (versão EU de 22 de setembro de 2026).','Datos del juego (versión EU del 22 de septiembre de 2026).'],
['Star upgrades','Melhorias de estrela','Mejoras de estrella'],['What each star unlocks, from the game data.','O que cada estrela libera, pelos dados do jogo.','Lo que desbloquea cada estrella, según los datos del juego.'],
['Star data is missing. Check in game.','Faltam dados de estrela. Confira no jogo.','Faltan datos de estrellas. Revisa en el juego.'],
['Orb, cells & potential','Orb, cells e potencial','Orb, cells y potencial'],['Upgrade costs for the orb are not known.','Os custos de melhoria do orb não são conhecidos.','No se conocen los costes de mejora del orb.'],
['Potentials for damage dealers: 4 Smash, 3 Initiate, 2 Undermine. For tanks: 3 DEF, 6 HP. (creator tip)','Potenciais para quem causa dano: 4 Smash, 3 Initiate, 2 Undermine. Para tanques: 3 DEF, 6 HP. (dica de criador)','Potenciales para atacantes: 4 Smash, 3 Initiate, 2 Undermine. Para tanques: 3 DEF, 6 HP. (consejo de creador)'],
['Open cells & potential →','Abrir cells e potencial →','Abrir cells y potencial →'],['Used on Best teams','Usado em Melhores equipes','Usado en Mejores equipos'],
['No team on Best teams uses this character yet.','Nenhuma equipe de Melhores equipes usa este personagem ainda.','Ningún equipo de Mejores equipos usa este personaje todavía.'],
['Route','Rota','Vía'],['Availability','Disponibilidade','Disponibilidad'],['Limited Banner','Banner limitado','Banner limitado'],
['Permanent Recruit','Recrutamento permanente','Reclutamiento permanente'],['Shard Box','Caixa de fragmentos','Caja de fragmentos'],['Shop','Loja','Tienda'],
['Achievement','Conquista','Logro'],['Event','Evento','Evento'],['Carnival','Carnival','Carnival'],
['Unknown: check in game','Desconhecido: confira no jogo','Desconocido: revisa en el juego'],
['Check your game: these routes may differ on your server.','Confira no seu jogo: estas rotas podem ser diferentes no seu servidor.','Revisa tu juego: estas vías pueden ser distintas en tu servidor.'],
['No route is confirmed for your server yet. Check the shop, banners and events in game.','Nenhuma rota confirmada para o seu servidor ainda. Confira a loja, os banners e os eventos no jogo.','Aún no hay una vía confirmada para tu servidor. Revisa la tienda, los banners y los eventos en el juego.'],
['Routes with no data yet','Rotas ainda sem dados','Vías aún sin datos'],['Notes from the old guide','Notas do guia antigo','Notas de la guía antigua'],
['The old guide has no note on how to get this character.','O guia antigo não tem nota sobre como conseguir este personagem.','La guía antigua no tiene notas sobre cómo conseguir este personaje.'],
['Open team builder','Abrir montador de equipes','Abrir creador de equipos'],
['These videos match the name in their title or topic. They may cover a different version.','Estes vídeos têm o nome no título ou no tema. Podem tratar de outra versão.','Estos videos tienen el nombre en su título o tema. Pueden tratar otra versión.'],
['Search all videos','Buscar todos os vídeos','Buscar todos los videos'],['DPS','DPS','DPS'],['Support','Suporte','Apoyo'],['Control','Controle','Control'],['Burst','Burst','Burst'],['Balance','Equilíbrio','Equilibrio'],
// team builder
['TEAM BUILDER','MONTADOR DE EQUIPES','CREADOR DE EQUIPOS'],['Build your own team.','Monte sua própria equipe.','Arma tu propio equipo.'],
['Pick characters, then save or export the team. For ready-made teams, see Best teams.','Escolha personagens e depois salve ou exporte a equipe. Para equipes prontas, veja Melhores equipes.','Elige personajes y luego guarda o exporta el equipo. Para equipos listos, mira Mejores equipos.'],
['Formation JSON','JSON da formação','JSON de la formación'],
['Exported formation appears here. Paste a formation JSON here to import.','A formação exportada aparece aqui. Cole um JSON de formação aqui para importar.','La formación exportada aparece aquí. Pega aquí un JSON de formación para importarla.'],
['Choose a character','Escolha um personagem','Elige un personaje'],['Read kit →','Ver kit →','Ver kit →'],['Not marked owned','Não marcado como seu','No marcado como tuyo'],
['← Swap','← Trocar','← Cambiar'],['That exact variant is already in this formation.','Essa variante já está nesta formação.','Esa variante ya está en esta formación.'],
['Formation review','Revisão da formação','Revisión de la formación'],['Choose characters above.','Escolha personagens acima.','Elige personajes arriba.'],
['None among selected characters.','Nenhum entre os escolhidos.','Ninguno entre los elegidos.'],
['Counts help you plan. Check passives, assists and mode bans on the game screen.','As contagens ajudam a planejar. Confira passivas, assistências e proibições do modo na tela do jogo.','Los recuentos ayudan a planificar. Revisa pasivas, asistencias y prohibiciones del modo en la pantalla del juego.'],
['Team name','Nome da equipe','Nombre del equipo'],['Mode / encounter','Modo / encontro','Modo / encuentro'],
['Field slots — confirm in game','Espaços em campo — confirme no jogo','Casillas en el campo — confírmalo en el juego'],['Optional reserve slots','Espaços de reserva opcionais','Casillas de reserva opcionales'],
['Show owned characters only','Mostrar só personagens que tenho','Mostrar solo personajes que tengo'],
['I checked these slot rules in this mode’s current screen.','Conferi estas regras de espaços na tela atual deste modo.','Revisé estas reglas de casillas en la pantalla actual de este modo.'],
['Save formation','Salvar formação','Guardar formación'],['Export JSON','Exportar JSON','Exportar JSON'],['Import JSON','Importar JSON','Importar JSON'],
['Clear slots','Limpar espaços','Vaciar casillas'],['Share / import a formation','Compartilhar / importar uma formação','Compartir / importar una formación'],
['Saved formations','Formações salvas','Formaciones guardadas'],['No saved formations yet.','Nenhuma formação salva ainda.','Aún no hay formaciones guardadas.'],
['Confirm the mode’s slot rules before saving.','Confirme as regras de espaços do modo antes de salvar.','Confirma las reglas de casillas del modo antes de guardar.'],
['Fill every field slot before saving.','Preencha todos os espaços em campo antes de salvar.','Llena todas las casillas del campo antes de guardar.'],
['Formation saved in this browser.','Formação salva neste navegador.','Formación guardada en este navegador.'],
['Imported formation. Review the rules before saving.','Formação importada. Revise as regras antes de salvar.','Formación importada. Revisa las reglas antes de guardar.'],
['Invalid team.','Equipe inválida.','Equipo no válido.'],
['Formation needs 4 or 5 field slots and 0–2 optional reserves.','A formação precisa de 4 ou 5 espaços em campo e 0–2 reservas opcionais.','La formación necesita 4 o 5 casillas en el campo y 0–2 reservas opcionales.'],
['Slot count does not match formation.','O número de espaços não bate com a formação.','El número de casillas no coincide con la formación.'],
['Unavailable character in formation.','Personagem indisponível na formação.','Personaje no disponible en la formación.'],
['A character variant cannot occupy two slots.','Uma variante de personagem não pode ocupar dois espaços.','Una variante de personaje no puede ocupar dos casillas.'],
// boss lab
['BOSS LAB','BOSS LAB','BOSS LAB'],['Boss skills and fight plans.','Habilidades dos chefes e planos de luta.','Habilidades de los jefes y planes de pelea.'],
['Read each boss’s skills, step through a plan, and log your own fights.','Leia as habilidades de cada chefe, siga um plano passo a passo e registre suas lutas.','Lee las habilidades de cada jefe, sigue un plan paso a paso y registra tus peleas.'],
['Skill text is copied from the game files. No plan here has been tested in a real fight.','O texto das habilidades é copiado dos arquivos do jogo (em inglês). Nenhum plano aqui foi testado numa luta real.','El texto de las habilidades se copia de los archivos del juego (en inglés). Ningún plan de aquí se ha probado en una pelea real.'],
['Best team →','Melhor equipe →','Mejor equipo →'],['Skills and plan →','Habilidades e plano →','Habilidades y plan →'],
['Back to all bosses','Voltar a todos os chefes','Volver a todos los jefes'],['← All bosses','← Todos os chefes','← Todos los jefes'],
['Best team for this boss →','Melhor equipe para este chefe →','Mejor equipo para este jefe →'],['This plan is not tested in a fight.','Este plano não foi testado numa luta.','Este plan no se ha probado en una pelea.'],
['Boss skills','Habilidades do chefe','Habilidades del jefe'],['Prebattle','Antes da batalha','Antes de la batalla'],['Turn 1','Turno 1','Turno 1'],['Turn 2','Turno 2','Turno 2'],
['Turn 3+','Turno 3+','Turno 3+'],['Phase trigger','Mudança de fase','Cambio de fase'],['Failsafe','Plano B','Plan B'],
['← Previous','← Anterior','← Anterior'],['Next step →','Próximo passo →','Siguiente paso →'],['Log a fight','Registrar uma luta','Registrar una pelea'],
['Difficulty, CP, team and stars, cells, starting cards…','Dificuldade, CP, equipe e estrelas, cells, cartas iniciais…','Dificultad, CP, equipo y estrellas, cells, cartas iniciales…'],
['What you cast each turn, phase changes, damage, what went wrong…','O que você usou em cada turno, mudanças de fase, dano, o que deu errado…','Lo que lanzaste cada turno, cambios de fase, daño, qué salió mal…'],
['Combat setup','Preparação do combate','Preparación del combate'],['Combat results','Resultado do combate','Resultado del combate'],
['What to write down','O que anotar','Qué anotar'],['Your setup','Sua preparação','Tu preparación'],['What happened','O que aconteceu','Qué pasó'],
['Save this fight','Salvar esta luta','Guardar esta pelea'],['Fill in both boxes first.','Preencha as duas caixas primeiro.','Llena las dos casillas primero.'],
['Fight saved in this browser.','Luta salva neste navegador.','Pelea guardada en este navegador.'],
// banners
['BANNERS','BANNERS','BANNERS'],['Live banner and banner history.','Banner ativo e histórico de banners.','Banner activo e historial de banners.'],
['What is on now, what came before, and your own notes.','O que está ativo agora, o que veio antes e suas anotações.','Lo que está activo ahora, lo que hubo antes y tus notas.'],
['LIVE NOW','ATIVO AGORA','ACTIVO AHORA'],
['Limited banner on established servers, October 25 – November 8, 2026. The unit is guaranteed at 300 pulls (90,000 Diamonds).','Banner limitado nos servidores antigos, de 25 de outubro a 8 de novembro de 2026. A unidade é garantida em 300 pulls (90.000 Diamonds).','Banner limitado en los servidores antiguos, del 25 de octubre al 8 de noviembre de 2026. La unidad está garantizada en 300 pulls (90.000 Diamonds).'],
['Free-to-play: skip her unless you play Anteiku.','Free-to-play: pule, a menos que você jogue de Anteiku.','Free-to-play: sáltala salvo que juegues Anteiku.'],
['Pulls 100 and 200 pay a random chest (about a 10% chance at her), not a pick.','Os pulls 100 e 200 dão um baú aleatório (cerca de 10% de chance de vir ela), não uma escolha.','Los pulls 100 y 200 dan un cofre aleatorio (cerca de un 10% de probabilidad de ella), no una elección.'],
['On the NA relaunch server she may appear around October 27, if banners follow the same dates. (unconfirmed)','No servidor de relançamento NA ela pode aparecer por volta de 27 de outubro, se os banners seguirem as mesmas datas. (não confirmado)','En el servidor de relanzamiento NA puede aparecer hacia el 27 de octubre, si los banners siguen las mismas fechas. (sin confirmar)'],
['Her kit cuts enemy healing by 60% and lifesteal by 30%, and adds a "can\'t die" effect to Anteiku teams.','O kit dela corta a cura inimiga em 60% e o roubo de vida em 30%, e dá um efeito de "não pode morrer" às equipes Anteiku.','Su kit reduce la curación enemiga un 60% y el robo de vida un 30%, y da un efecto de "no puede morir" a los equipos Anteiku.'],
['Change it →','Alterar →','Cambiar →'],['All banners','Todos os banners','Todos los banners'],['Live now','Ativo agora','Activo ahora'],['Past banners','Banners antigos','Banners pasados'],
['Live limited banner','Banner limitado ativo','Banner limitado activo'],['Past banner (player report)','Banner antigo (relato de jogador)','Banner pasado (informe de jugador)'],
['Banner name, exact version, server, start and end time, rates, pity, screenshot file…','Nome do banner, versão exata, servidor, início e fim, taxas, pity, arquivo do print…','Nombre del banner, versión exacta, servidor, inicio y fin, tasas, pity, archivo de captura…'],
['Your banner notes','Suas anotações de banner','Tus notas de banners'],['Saved only in this browser.','Salvo só neste navegador.','Guardado solo en este navegador.'],
['Banner notes','Anotações de banner','Notas de banners'],['Save notes','Salvar anotações','Guardar notas'],['Notes saved.','Anotações salvas.','Notas guardadas.'],
['Calculate your pull budget →','Calcule seu orçamento de pulls →','Calcula tu presupuesto de pulls →'],
// modes, cells, coffee
['GAME MODES','MODOS DE JOGO','MODOS DE JUEGO'],['All 14 modes.','Os 14 modos.','Los 14 modos.'],['How to unlock and play each one.','Como desbloquear e jogar cada um.','Cómo desbloquear y jugar cada uno.'],
['Unlocks and daily limits come from the old guide and may differ on your server.','Desbloqueios e limites diários vêm do guia antigo e podem ser diferentes no seu servidor.','Los desbloqueos y límites diarios vienen de la guía antigua y pueden ser distintos en tu servidor.'],
['Unlock not documented','Desbloqueio não documentado','Desbloqueo sin documentar'],['Open walkthrough →','Abrir guia passo a passo →','Abrir guía paso a paso →'],['← All modes','← Todos os modos','← Todos los modos'],
['CELLS','CELLS','CELLS'],['Cells and potential.','Cells e potencial.','Cells y potencial.'],['72 cell families and 4 LR cells, searchable.','72 famílias de cells e 4 cells LR, com busca.','72 familias de cells y 4 cells LR, con búsqueda.'],
['The full 105-cell LR catalog is still missing from the data.','O catálogo completo de 105 cells LR ainda falta nos dados.','Aún falta en los datos el catálogo completo de 105 cells LR.'],
['24 cell descriptions don’t match their attribute in the data.','24 descrições de cells não batem com o atributo nos dados.','24 descripciones de cells no coinciden con su atributo en los datos.'],
['Those entries stay flagged; don’t use them for color matching. The LR cells have no confirmed full effect text.','Essas entradas ficam marcadas; não as use para combinar cores. As cells LR não têm texto de efeito completo confirmado.','Esas entradas quedan marcadas; no las uses para combinar colores. Las cells LR no tienen un texto de efecto completo confirmado.'],
['Cell name, stat, effect or attribute','Nome da cell, status, efeito ou atributo','Nombre de la cell, estadística, efecto o atributo'],['Search cells','Buscar cells','Buscar cells'],
['Full effect text unavailable.','Texto completo do efeito indisponível.','Texto completo del efecto no disponible.'],['Text does not match its attribute','O texto não bate com o atributo','El texto no coincide con su atributo'],
['Related character →','Personagem relacionado →','Personaje relacionado →'],['No matching cell entries.','Nenhuma cell encontrada.','No se encontraron cells.'],
['Potential & orbs','Potencial e orbs','Potencial y orbs'],
['Star effects and orb art are on each character page. Potential nodes, costs and best picks are not known yet.','Efeitos de estrela e arte dos orbs estão na página de cada personagem. Nós de potencial, custos e melhores escolhas ainda não são conhecidos.','Los efectos de estrella y el arte de los orbs están en la página de cada personaje. Los nodos de potencial, costes y mejores opciones aún no se conocen.'],
['Browse characters →','Ver personagens →','Ver personajes →'],
['COFFEE','CAFÉ','CAFÉ'],['24 coffee recipes.','24 receitas de café.','24 recetas de café.'],['Collect the illustrations and check Organization Supply.','Colecione as ilustrações e confira o Organization Supply.','Colecciona las ilustraciones y revisa el Organization Supply.'],
['No combat bonus from coffee is known.','Não se conhece nenhum bônus de combate do café.','No se conoce ningún bonus de combate del café.'],['Recipe or ingredient','Receita ou ingrediente','Receta o ingrediente'],
['Search coffee','Buscar café','Buscar café'],['All temperatures','Todas as temperaturas','Todas las temperaturas'],['hot','quente','caliente'],['iced','gelado','helado'],
['Find a recipe','Encontre uma receita','Busca una receta'],['Temperature','Temperatura','Temperatura'],
['Rarity is random; ingredients do not guarantee it.','A raridade é aleatória; os ingredientes não a garantem.','La rareza es aleatoria; los ingredientes no la garantizan.'],
['Recipe video ↗','Vídeo da receita ↗','Video de la receta ↗'],['No recipes match these filters.','Nenhuma receita com esses filtros.','Ninguna receta coincide con estos filtros.'],
// videos
['VIDEOS','VÍDEOS','VIDEOS'],['157 creator videos.','157 vídeos de criadores.','157 videos de creadores.'],['Search by creator, topic, character or title.','Busque por criador, tema, personagem ou título.','Busca por creador, tema, personaje o título.'],
['Videos can be outdated or removed. A title match is not checked advice. No video autoplays.','Os vídeos podem estar desatualizados ou ter sido removidos. Bater com o título não é conselho verificado. Nenhum vídeo toca sozinho.','Los videos pueden estar desactualizados o eliminados. Que coincida el título no es un consejo verificado. Ningún video se reproduce solo.'],
['Creator, topic, character or title','Criador, tema, personagem ou título','Creador, tema, personaje o título'],['Search videos','Buscar vídeos','Buscar videos'],['Topic','Tema','Tema'],['All topics','Todos os temas','Todos los temas'],
['Guild war','Guild War','Guild War'],['Pulls and banners','Pulls e banners','Pulls y banners'],['News','Notícias','Noticias'],['PvE modes','Modos PvE','Modos PvE'],['Tier lists','Tier lists','Tier lists'],
['Free-to-play progress','Progresso free-to-play','Progreso free-to-play'],['Beginner guides','Guias para iniciantes','Guías para principiantes'],['Spending','Gastos','Gastos'],
['No matching videos. Try a broader name.','Nenhum vídeo encontrado. Tente um nome mais amplo.','No hay videos. Prueba un nombre más general.'],['No summary yet.','Ainda sem resumo.','Aún sin resumen.'],
['Where this summary comes from','De onde vem este resumo','De dónde sale este resumen'],['This summary comes from the video title.','Este resumo vem do título do vídeo.','Este resumen sale del título del video.'],
['This summary comes from the video title and description.','Este resumo vem do título e da descrição do vídeo.','Este resumen sale del título y la descripción del video.'],
['This summary comes from the video transcript.','Este resumo vem da transcrição do vídeo.','Este resumen sale de la transcripción del video.'],
['This summary comes from the video description.','Este resumo vem da descrição do vídeo.','Este resumen sale de la descripción del video.'],['Watch on YouTube ↗','Assistir no YouTube ↗','Ver en YouTube ↗'],
// daily plan
['DAILY PLAN','PLANO DIÁRIO','PLAN DIARIO'],['Your daily checklist and milestones.','Seu checklist diário e suas metas.','Tu lista diaria y tus metas.'],
['Tick off today’s tasks. Your server day is set on the Account page.','Marque as tarefas de hoje. O dia do seu servidor é definido na página Minha conta.','Marca las tareas de hoy. El día de tu servidor se define en la página Mi cuenta.'],
['Server day helps you plan; it does not prove an event or shop has opened.','O dia do servidor ajuda a planejar; não prova que um evento ou loja abriu.','El día del servidor ayuda a planificar; no prueba que un evento o tienda haya abierto.'],
['Update your server →','Atualize seu servidor →','Actualiza tu servidor →'],
['Account age, server age and Chain depth unlock different things.','Idade da conta, idade do servidor e Chain depth liberam coisas diferentes.','La edad de la cuenta, la del servidor y la Chain depth desbloquean cosas distintas.'],
['Check which one a mode uses.','Confira qual delas um modo usa.','Revisa cuál usa cada modo.'],['Today’s checklist','Checklist de hoje','Lista de hoy'],
['The checklist resets at midnight on your device, not at the game reset.','O checklist reinicia à meia-noite no seu aparelho, não no reset do jogo.','La lista se reinicia a medianoche en tu dispositivo, no con el reinicio del juego.'],
['Claim event and daily rewards before their timers end','Resgate as recompensas diárias e de eventos antes que o tempo acabe','Reclama las recompensas diarias y de eventos antes de que se acabe el tiempo'],
['Spend your daily tries (Arena, bosses, sweeps)','Use suas tentativas diárias (Arena, chefes, sweeps)','Usa tus intentos diarios (Arena, jefes, barridos)'],
['Collect idle rewards and fill Organization Supply','Colete as recompensas idle e preencha o Organization Supply','Recoge las recompensas idle y llena el Organization Supply'],
['Check the next passive you can unlock before you spend','Veja a próxima passiva que você pode liberar antes de gastar','Mira la próxima pasiva que puedes desbloquear antes de gastar'],
['Spend guild-war attack charges on Saturday; never sit at 10','Gaste as cargas de ataque da Guild War no sábado; nunca fique parado em 10','Gasta las cargas de ataque de la Guild War el sábado; nunca te quedes en 10'],
['Milestones','Metas','Metas'],
// account
['MY ACCOUNT','MINHA CONTA','MI CUENTA'],['Make this guide yours.','Deixe este guia com a sua cara.','Haz tuya esta guía.'],
['Your collection, teams and notes stay in this browser. Export a backup before you change device.','Sua coleção, equipes e anotações ficam neste navegador. Exporte um backup antes de trocar de aparelho.','Tu colección, equipos y notas se quedan en este navegador. Exporta una copia antes de cambiar de dispositivo.'],
['Clearing browser data also clears this profile. Calculator numbers have their own reset.','Limpar os dados do navegador também apaga este perfil. Os números das calculadoras têm um reset próprio.','Borrar los datos del navegador también borra este perfil. Los números de las calculadoras tienen su propio reinicio.'],
['Region not set','Região não definida','Región sin definir'],['Asia','Ásia','Asia'],['Other','Outra','Otra'],['Server region','Região do servidor','Región del servidor'],
['Server age in days','Idade do servidor em dias','Edad del servidor en días'],['Optional budget cap (your currency)','Limite de gastos opcional (sua moeda)','Límite de gasto opcional (tu moneda)'],
['Simple mode · hide decorative artwork','Modo simples · ocultar artes decorativas','Modo simple · ocultar el arte decorativo'],['Account plan / resources / cells','Plano da conta / recursos / cells','Plan de la cuenta / recursos / cells'],
['Save profile','Salvar perfil','Guardar perfil'],['Enter a valid server day and non-negative budget.','Informe um dia de servidor válido e um orçamento não negativo.','Introduce un día de servidor válido y un presupuesto no negativo.'],
['Profile saved locally.','Perfil salvo neste aparelho.','Perfil guardado en este dispositivo.'],['Add characters →','Adicionar personagens →','Añadir personajes →'],
['Open any character page to mark it owned and record its stars.','Abra a página de um personagem para marcá-lo como seu e registrar as estrelas.','Abre la página de un personaje para marcarlo como tuyo y anotar sus estrellas.'],
['Backup & privacy','Backup e privacidade','Copia de seguridad y privacidad'],['Profile backup','Backup do perfil','Copia del perfil'],['Profile backup JSON','JSON do backup do perfil','JSON de la copia del perfil'],
['Export appears here. Paste a saved profile JSON to restore.','A exportação aparece aqui. Cole um JSON de perfil salvo para restaurar.','La exportación aparece aquí. Pega un JSON de perfil guardado para restaurarlo.'],
['Export profile','Exportar perfil','Exportar perfil'],['Import profile','Importar perfil','Importar perfil'],['Profile is too large.','O perfil é grande demais.','El perfil es demasiado grande.'],
['Profile imported.','Perfil importado.','Perfil importado.'],['Unsupported profile version.','Versão de perfil não suportada.','Versión de perfil no compatible.'],
['I exported anything I need and want to clear this guide’s profile.','Exportei o que preciso e quero apagar o perfil deste guia.','Ya exporté lo que necesito y quiero borrar el perfil de esta guía.'],
['Clear local profile','Apagar perfil local','Borrar perfil local'],['Check the confirmation box first.','Marque a caixa de confirmação primeiro.','Marca primero la casilla de confirmación.'],
['Profile cleared. Calculator observations have their own reset.','Perfil apagado. As anotações das calculadoras têm um reset próprio.','Perfil borrado. Las notas de las calculadoras tienen su propio reinicio.'],
['No sign-in, analytics or syncing. Some browsers limit storage for local files; JSON backups always work.','Sem login, análises ou sincronização. Alguns navegadores limitam o armazenamento de arquivos locais; backups em JSON sempre funcionam.','Sin inicio de sesión, analíticas ni sincronización. Algunos navegadores limitan el almacenamiento de archivos locales; las copias en JSON siempre funcionan.'],
['Browser storage unavailable. Export your profile to keep changes.','Armazenamento do navegador indisponível. Exporte seu perfil para manter as mudanças.','Almacenamiento del navegador no disponible. Exporta tu perfil para conservar los cambios.'],
['Storage unavailable: changes last for this tab only. Export a profile backup.','Armazenamento indisponível: as mudanças valem só para esta aba. Exporte um backup do perfil.','Almacenamiento no disponible: los cambios duran solo en esta pestaña. Exporta una copia del perfil.'],
['This section could not render. Your saved profile remains local. Try another section or export a backup.','Esta seção não pôde ser exibida. Seu perfil salvo continua no aparelho. Tente outra seção ou exporte um backup.','Esta sección no se pudo mostrar. Tu perfil guardado sigue en tu dispositivo. Prueba otra sección o exporta una copia.'],
// sources
['MORE','MAIS','MÁS'],['Sources and full articles.','Fontes e artigos completos.','Fuentes y artículos completos.'],
['Where the guide’s facts come from, and the old full articles.','De onde vêm os fatos do guia e os artigos completos antigos.','De dónde salen los datos de la guía y los artículos completos antiguos.'],
['Game facts, creator tips and guild tips are labeled. This guide is saved research, not a live feed from your account.','Fatos do jogo, dicas de criadores e dicas de guild vêm marcados. Este guia é pesquisa salva, não um feed ao vivo da sua conta.','Los datos del juego, consejos de creadores y consejos de guild están marcados. Esta guía es investigación guardada, no un feed en vivo de tu cuenta.'],
['Full skill sets','Kits completos','Kits completos'],['Attribute fixes','Atributos corrigidos','Atributos corregidos'],['No portrait yet','Ainda sem retrato','Aún sin retrato'],
['Full articles (October 19, 2026)','Artigos completos (19 de outubro de 2026, em inglês)','Artículos completos (19 de octubre de 2026, en inglés)'],
['The old full articles, kept for reference. Their dates and offers are not updated.','Os artigos completos antigos, guardados para consulta. Estão em inglês, e as datas e ofertas não são atualizadas.','Los artículos completos antiguos, guardados como referencia. Están en inglés y sus fechas y ofertas no se actualizan.'],
['Planner by server day','Planejador por dia do servidor','Planificador por día del servidor'],['Guild war and Carnival','Guild War e Carnival','Guild War y Carnival'],
['Early, mid and end game','Início, meio e fim de jogo','Inicio, mitad y final del juego'],['Pull and spend','Pulls e gastos','Pulls y gastos'],['Server calendar','Calendário do servidor','Calendario del servidor'],
['Tips and tricks','Dicas e truques','Consejos y trucos'],['Unlimited Recruitment tiers','Tiers do Unlimited Recruitment','Tiers de Unlimited Recruitment'],
// sources page: what is not known yet, source list (expert.json unknowns and sources)
['Full LR cell list','Lista completa de LR cells','Lista completa de LR cells'],
['missing','faltando','falta'],
['Community lists name 105 LR cells, but no full records were found. Four are listed as leads only.','As listas da comunidade citam 105 LR cells, mas nenhum registro completo foi encontrado. Quatro aparecem só como pistas.','Las listas de la comunidad nombran 105 LR cells, pero no se encontró ningún registro completo. Cuatro aparecen solo como pistas.'],
['Tested fights','Lutas testadas','Combates probados'],
['not tested','não testado','no probado'],
['None of the 8 Boss Lab plans has been tested in a real fight. No damage numbers are promised.','Nenhum dos 8 planos do Boss Lab foi testado em uma luta de verdade. Nenhum número de dano é prometido.','Ninguno de los 8 planes del Boss Lab se ha probado en un combate real. No se promete ninguna cifra de daño.'],
['Team size in each mode','Tamanho da equipe em cada modo','Tamaño del equipo en cada modo'],
['sources disagree','as fontes discordam','las fuentes no coinciden'],
['Some sources list 5 units on the field. This guide uses 4 on the field plus 1 back-up; check the team screen in each mode.','Algumas fontes listam 5 unidades em campo. Este guia usa 4 em campo mais 1 back-up; confira a tela de equipe em cada modo.','Algunas fuentes indican 5 unidades en el campo. Esta guía usa 4 en el campo más 1 back-up; revisa la pantalla de equipo en cada modo.'],
['Coffee combat bonuses','Bônus de combate do café','Bonus de combate del café'],
['none known','nenhum conhecido','ninguno conocido'],
['Coffee is for the illustration collection and Organization Supply. No combat bonus is known.','O café serve para a coleção de ilustrações e para o Organization Supply. Nenhum bônus de combate é conhecido.','El café sirve para la colección de ilustraciones y para Organization Supply. No se conoce ningún bonus de combate.'],
['Shop and banners on your server','Loja e banners no seu servidor','Tienda y banners en tu servidor'],
['check in game','confira no jogo','revísalo en el juego'],
['Banners and shop items differ by server. Dates on this guide come from established servers and fan data.','Banners e itens da loja mudam de servidor para servidor. As datas deste guia vêm de servidores mais antigos e de dados de fãs.','Los banners y los artículos de la tienda cambian según el servidor. Las fechas de esta guía vienen de servidores más antiguos y de datos de fans.'],
['Strategy research notes, checked by an independent fact-check (teams, bosses, live banner)','Notas de pesquisa de estratégia, conferidas por uma checagem de fatos independente (equipes, bosses, banner atual)','Notas de investigación de estrategia, revisadas por una verificación de datos independiente (equipos, bosses, banner actual)'],
['main source for Best teams; kept with the guide source files, not published','fonte principal de Melhores equipes; guardada com os arquivos-fonte do guia, não publicada','fuente principal de Mejores equipos; guardada con los archivos fuente de la guía, no publicada'],
['Stage and faction research notes','Notas de pesquisa de fases e facções','Notas de investigación de fases y facciones'],
['research notes; check your server','notas de pesquisa; confira o seu servidor','notas de investigación; revisa tu servidor'],
['Boss skill text from the game files','Texto das skills dos bosses, dos arquivos do jogo','Texto de las habilidades de los bosses, de los archivos del juego'],
['game text; not every skill is matched to a boss','texto do jogo; nem toda skill está ligada a um boss','texto del juego; no todas las habilidades están asociadas a un boss'],
['English game text','Texto do jogo em inglês','Texto del juego en inglés'],
['game data','dados do jogo','datos del juego'],
['StillAliveGG coffee recipes','Receitas de café do StillAliveGG','Recetas de café de StillAliveGG'],
['creator video','vídeo de criador','video de creador'],
['Kees LR cell catalog','Catálogo de LR cells do Kees','Catálogo de LR cells de Kees'],
['site opens, but the full list could not be read','o site abre, mas não foi possível ler a lista completa','el sitio abre, pero no se pudo leer la lista completa'],
['Banner notes from players','Anotações de banners feitas por jogadores','Notas de banners hechas por jugadores'],
['past banners; dates and region unknown','banners antigos; datas e região desconhecidas','banners pasados; fechas y región desconocidas'],
['What is not known yet','O que ainda não se sabe','Lo que aún no se sabe'],['Source list','Lista de fontes','Lista de fuentes'],['Artwork & rights','Artes e direitos','Arte y derechos'],
['This is an unofficial fan guide. Character art belongs to the game’s rights holders and is not licensed for redistribution.','Este é um guia de fã não oficial. As artes dos personagens pertencem aos donos dos direitos do jogo e não têm licença de redistribuição.','Esta es una guía de fans no oficial. El arte de los personajes pertenece a los titulares de derechos del juego y no tiene licencia para redistribuirse.'],
['Where each image comes from ↗','De onde vem cada imagem ↗','De dónde sale cada imagen ↗'],
['22 characters have no portrait yet and show a placeholder instead.','22 personagens ainda não têm retrato e mostram um marcador no lugar.','22 personajes aún no tienen retrato y muestran un marcador en su lugar.'],
['Data checks','Verificações de dados','Comprobaciones de datos'],['Open questions in the data ↗','Perguntas em aberto nos dados ↗','Preguntas abiertas en los datos ↗'],
['101 attribute fixes ↗','101 atributos corrigidos ↗','101 atributos corregidos ↗'],['Rarity fix ↗','Raridade corrigida ↗','Rareza corregida ↗'],
// search
['SEARCH','BUSCA','BÚSQUEDA'],['Search the guide.','Buscar no guia.','Buscar en la guía.'],
['Search an exact variant, nickname, boss, recipe, mode or guide.','Busque uma variante exata, apelido, chefe, receita, modo ou guia.','Busca una variante exacta, apodo, jefe, receta, modo o guía.'],
['No exact match. Try a shorter name or variant.','Nada exato. Tente um nome ou variante mais curto.','No hay coincidencia exacta. Prueba un nombre o variante más corto.'],
['Mode walkthrough','Guia de modo','Guía de modo'],['Coffee recipe','Receita de café','Receta de café'],['Guide / tool','Guia / ferramenta','Guía / herramienta'],
// tools (economy.js)
['TOOLS','FERRAMENTAS','HERRAMIENTAS'],['Diamond and pull calculators.','Calculadoras de Diamonds e pulls.','Calculadoras de Diamonds y pulls.'],
['Enter the numbers from your game. Nothing is assumed.','Digite os números do seu jogo. Nada é presumido.','Introduce los números de tu juego. No se supone nada.'],
['Spend with a plan','Gaste com um plano','Gasta con un plan'],
['These tools only calculate what you enter. Spending nothing is a fine plan.','Estas ferramentas só calculam o que você digita. Não gastar nada é um ótimo plano.','Estas herramientas solo calculan lo que introduces. No gastar nada es un buen plan.'],
['They do not know your current shop, payout table, banner rules or live prices.','Elas não conhecem sua loja atual, tabela de prêmios, regras de banner nem preços ao vivo.','No conocen tu tienda actual, tabla de premios, reglas de banners ni precios en vivo.'],
['Your server / region','Seu servidor / região','Tu servidor / región'],['Cash currency (no conversion)','Moeda (sem conversão)','Moneda (sin conversión)'],
['Optional cash budget','Orçamento opcional em dinheiro','Presupuesto opcional en dinero'],
['Budget presets are amounts in the selected currency. Changing currency does not convert existing prices. Start at 0; purchases are optional. Nothing is purchased or sent from this page.','Os valores prontos estão na moeda escolhida. Trocar a moeda não converte os preços já digitados. Comece em 0; compras são opcionais. Nada é comprado nem enviado desta página.','Los importes rápidos están en la moneda elegida. Cambiar la moneda no convierte los precios ya introducidos. Empieza en 0; las compras son opcionales. Desde esta página no se compra ni se envía nada.'],
['48-hour Diamond Spring','Diamond Spring de 48 horas','Diamond Spring de 48 horas'],
['Enter your stake and the TOTAL Diamonds returned, including the stake.','Digite seu depósito e o TOTAL de Diamonds devolvidos, incluindo o depósito.','Introduce tu depósito y el TOTAL de Diamonds devueltos, incluido el depósito.'],
['No payout is filled in for you: read both numbers from your game.','Nenhum retorno vem preenchido: leia os dois números no seu jogo.','No se rellena ningún pago por ti: lee los dos números en tu juego.'],
['Diamonds staked','Diamonds depositados','Diamonds depositados'],['Total diamonds returned','Total de Diamonds devolvidos','Total de Diamonds devueltos'],
['Stake start (your local time)','Início do depósito (seu horário local)','Inicio del depósito (tu hora local)'],
['Note (for example a screenshot name)','Nota (por exemplo, o nome de um print)','Nota (por ejemplo, el nombre de una captura)'],
['Your screenshot or source (this tool does not check it)','Seu print ou fonte (esta ferramenta não confere)','Tu captura o fuente (esta herramienta no la comprueba)'],['Date you checked','Data em que você conferiu','Fecha en que lo revisaste'],
['ROI = (total returned − stake) ÷ stake × 100. The timer adds exactly 48 elapsed hours; it does not assume a second daily collection or any VIP perk. Compare the locked stake with the resources needed for your next guarantee.','ROI = (total devolvido − depósito) ÷ depósito × 100. O cronômetro soma exatamente 48 horas; não presume uma segunda coleta diária nem vantagem VIP. Compare o depósito travado com os recursos de que você precisa para a próxima garantia.','ROI = (total devuelto − depósito) ÷ depósito × 100. El temporizador suma exactamente 48 horas; no supone una segunda recogida diaria ni ventajas VIP. Compara el depósito bloqueado con los recursos que necesitas para tu próxima garantía.'],
['Banner budget & chance','Orçamento e chance no banner','Presupuesto y probabilidad del banner'],['Enter this banner’s rules from the game screen.','Digite as regras deste banner a partir da tela do jogo.','Introduce las reglas de este banner desde la pantalla del juego.'],
['The chance assumes every pull has the same rate. It ignores pity and rate changes.','A chance supõe que todo pull tem a mesma taxa. Ignora pity e mudanças de taxa.','La probabilidad supone que cada pull tiene la misma tasa. Ignora el pity y los cambios de tasa.'],
['Diamonds per pull','Diamonds por pull','Diamonds por pull'],['Pulls to the guarantee (from the game screen)','Pulls até a garantia (na tela do jogo)','Pulls hasta la garantía (en la pantalla del juego)'],
['Eligible pulls already made','Pulls válidos já feitos','Pulls válidos ya hechos'],['Available diamonds','Diamonds disponíveis','Diamonds disponibles'],
['Eligible tickets (1 pull each)','Tickets válidos (1 pull cada)','Tickets válidos (1 pull cada uno)'],
['I checked in game that this guarantee gives my unit and that these pulls and tickets count','Conferi no jogo que esta garantia dá a minha unidade e que estes pulls e tickets contam','Comprobé en el juego que esta garantía da mi unidad y que estos pulls y tickets cuentan'],
['Target-unit rate (%)','Taxa da unidade alvo (%)','Tasa de la unidad objetivo (%)'],['Number of pulls','Número de pulls','Número de pulls'],
['This is a first-copy / one-guarantee calculation. Star upgrades may require different materials or additional copies. No carry-over, selected-unit guarantee or ticket eligibility is assumed. A probability is never a promise.','Este é um cálculo para a primeira cópia / uma garantia. Melhorias de estrela podem exigir outros materiais ou cópias extras. Não se presume transferência, garantia de unidade escolhida nem validade de tickets. Uma probabilidade nunca é uma promessa.','Este es un cálculo de primera copia / una garantía. Las mejoras de estrella pueden requerir otros materiales o copias adicionales. No se supone transferencia, garantía de unidad elegida ni validez de tickets. Una probabilidad nunca es una promesa.'],
['Compare offers you see','Compare as ofertas que você vê','Compara las ofertas que ves'],
['Enter the TOTAL Diamonds you can collect, not a daily reward.','Digite o TOTAL de Diamonds que você pode coletar, não uma recompensa diária.','Introduce el TOTAL de Diamonds que puedes recoger, no una recompensa diaria.'],
['Compare the same region, currency and date. Only give tickets a value when they help the same goal. Random rewards and non-Diamond items are left out.','Compare a mesma região, moeda e data. Só dê valor aos tickets quando eles servirem ao mesmo objetivo. Recompensas aleatórias e itens que não são Diamonds ficam de fora.','Compara la misma región, moneda y fecha. Solo da valor a los tickets cuando sirvan al mismo objetivo. Las recompensas aleatorias y los objetos que no son Diamonds quedan fuera.'],
['Offer A','Oferta A','Oferta A'],['Offer B','Oferta B','Oferta B'],['Offer name','Nome da oferta','Nombre de la oferta'],['Cash price','Preço em dinheiro','Precio en dinero'],
['Total collectible diamonds','Total de Diamonds coletáveis','Total de Diamonds recogibles'],['Eligible tickets','Tickets válidos','Tickets válidos'],
['Diamonds you count per ticket','Diamonds que você conta por ticket','Diamonds que cuentas por ticket'],['Days to collect total rewards','Dias para coletar tudo','Días para recoger todo'],
['Purchase cap for this window','Limite de compras nesta janela','Límite de compras en esta ventana'],['Copies in your plan','Cópias no seu plano','Copias en tu plan'],['Server or region','Servidor ou região','Servidor o región'],
['Recurring / subscription (price entered is one billing period)','Recorrente / assinatura (o preço digitado é um período de cobrança)','Recurrente / suscripción (el precio es un periodo de facturación)'],
['Diamond-equivalent utility is your assumption, not an exchange guarantee. A recurring plan here counts only the entered number of billing periods; it does not cancel automatically. Uncollected daily rewards reduce actual value. First-purchase bonuses and caps must be included from your game screen.','O valor em Diamonds equivalentes é uma suposição sua, não uma garantia de troca. Um plano recorrente aqui conta só o número de períodos digitado; ele não cancela sozinho. Recompensas diárias não coletadas reduzem o valor real. Bônus de primeira compra e limites devem vir da tela do jogo.','El valor en Diamonds equivalentes es una suposición tuya, no una garantía de cambio. Un plan recurrente aquí cuenta solo el número de periodos introducido; no se cancela solo. Las recompensas diarias no recogidas reducen el valor real. Los bonus de primera compra y los límites deben salir de la pantalla del juego.'],
['Savings forecast','Previsão de economia','Previsión de ahorro'],['Use your daily income after your usual costs.','Use sua renda diária depois dos seus gastos de costume.','Usa tus ingresos diarios después de tus gastos habituales.'],
['This is a simple estimate with no assumed events, investment compounding or guaranteed future income.','É uma estimativa simples, sem eventos presumidos, juros compostos ou renda futura garantida.','Es una estimación simple, sin eventos supuestos, interés compuesto ni ingresos futuros garantizados.'],
['Current diamond balance','Saldo atual de Diamonds','Saldo actual de Diamonds'],['Estimated net diamonds per day','Diamonds líquidos estimados por dia','Diamonds netos estimados por día'],
['Target diamond balance','Saldo-alvo de Diamonds','Saldo objetivo de Diamonds'],['Clear calculator observations','Limpar anotações das calculadoras','Borrar notas de las calculadoras'],
['Browser storage is unavailable; calculations still work, but observations are not saved.','O armazenamento do navegador está indisponível; os cálculos funcionam, mas as anotações não são salvas.','El almacenamiento del navegador no está disponible; los cálculos funcionan, pero las notas no se guardan.'],
['not set','não definida','sin definir'],
['Enter both numbers from your game to see the net return.','Digite os dois números do seu jogo para ver o retorno líquido.','Introduce los dos números de tu juego para ver el retorno neto.'],
['No stake start time saved.','Nenhum horário de início salvo.','No hay hora de inicio guardada.'],
['Time is up. Collect it in the game.','O tempo acabou. Colete no jogo.','Se acabó el tiempo. Recógelo en el juego.'],['Check the collection rules in the game.','Confira as regras de coleta no jogo.','Revisa las reglas de recogida en el juego.'],
['Tick the box above to see the budget for the guarantee.','Marque a caixa acima para ver o orçamento até a garantia.','Marca la casilla de arriba para ver el presupuesto para la garantía.'],
['Enter a target-unit rate and pull count for a probability estimate.','Digite a taxa da unidade alvo e o número de pulls para estimar a probabilidade.','Introduce la tasa de la unidad objetivo y el número de pulls para estimar la probabilidad.'],
['No offer entered yet.','Nenhuma oferta digitada ainda.','Aún no hay ofertas.'],
['Planned copies exceed this offer’s entered purchase cap.','As cópias planejadas passam do limite de compras desta oferta.','Las copias planeadas superan el límite de compras de esta oferta.'],
['Cannot total this plan: fix the selected offer errors.','Não dá para somar este plano: corrija os erros das ofertas escolhidas.','No se puede sumar este plan: corrige los errores de las ofertas elegidas.'],
['Enter your income estimate and target.','Digite sua estimativa de renda e a meta.','Introduce tu estimación de ingresos y el objetivo.'],
['Target cannot be reached with zero net daily income.','A meta não pode ser alcançada com renda diária líquida zero.','El objetivo no se puede alcanzar con ingresos diarios netos de cero.'],
['Your entered balance already meets the target.','O saldo digitado já atinge a meta.','El saldo introducido ya alcanza el objetivo.'],
['Eligible pulls cannot exceed the entered guarantee threshold; check the reset rule.','Os pulls válidos não podem passar do limite da garantia; confira a regra de reset.','Los pulls válidos no pueden superar el umbral de la garantía; revisa la regla de reinicio.'],
['Target rate must be between 0 and 100%.','A taxa alvo deve estar entre 0 e 100%.','La tasa objetivo debe estar entre 0 y 100%.'],
['Pack must contain a positive diamond or ticket utility.','O pacote precisa ter um valor positivo em Diamonds ou tickets.','El pack debe tener un valor positivo en Diamonds o tickets.'],
['Choose the stake start time.','Escolha o horário de início do depósito.','Elige la hora de inicio del depósito.'],['Enter a valid stake start time.','Digite um horário de início válido.','Introduce una hora de inicio válida.'],
['Stake','Depósito','Depósito'],['Total returned','Total devolvido','Total devuelto'],['Cost per pull','Custo por pull','Coste por pull'],['Guarantee threshold','Limite da garantia','Umbral de la garantía'],
['Target rate','Taxa alvo','Tasa objetivo'],['Pack price','Preço do pacote','Precio del pack'],['Pack diamonds','Diamonds do pacote','Diamonds del pack'],['Pack tickets','Tickets do pacote','Tickets del pack'],
['Assumed diamond value per ticket','Valor presumido em Diamonds por ticket','Valor supuesto en Diamonds por ticket'],['Collection days','Dias de coleta','Días de recogida'],['Purchase cap','Limite de compras','Límite de compras'],
['Current balance','Saldo atual','Saldo actual'],['Net daily income','Renda diária líquida','Ingresos diarios netos'],['Target','Meta','Objetivo'],['Planned copies','Cópias planejadas','Copias planeadas'],['Cash budget','Orçamento em dinheiro','Presupuesto en dinero'],
// language offer
// level tabs and page labels (round 13)
['Starter','Inicial','Inicial'],['Mid','Intermediário','Intermedio'],['Endgame','Endgame','Endgame'],['Trials','Provas','Pruebas'],
['unknown','desconhecido','desconocido'],
['Language','Idioma','Idioma'],
// GPT-audit port (10-27): exact versions, complete-team filter, stats, review request, calculator additions
['The game data does not confirm which star unlocks some of these passives. Check the star preview in game.','Os dados do jogo não confirmam em qual estrela algumas destas passivas são liberadas. Confira a prévia de estrelas no jogo.','Los datos del juego no confirman con qué estrella se desbloquean algunas de estas pasivas. Revisa la vista previa de estrellas en el juego.'],
['The game data does not confirm which star unlocks each passive of this unit, so the “At 0★” rating may be off.','Os dados do jogo não confirmam em qual estrela cada passiva desta unidade é liberada, então a nota “Com 0★” pode estar errada.','Los datos del juego no confirman con qué estrella se desbloquea cada pasiva de esta unidad, así que la nota “Con 0★” puede fallar.'],
['Only teams I fully own','Só equipes que tenho completas','Solo equipos que tengo completos'],
['None of these teams is complete in your collection yet. Untick “Only teams I fully own” to see close matches.','Nenhuma destas equipes está completa na sua coleção ainda. Desmarque “Só equipes que tenho completas” para ver as mais próximas.','Ninguno de estos equipos está completo en tu colección todavía. Desmarca “Solo equipos que tengo completos” para ver los más cercanos.'],
['Your stats (optional)','Seus status (opcional)','Tus estadísticas (opcional)'],
['Optional. Copy them from the character screen in game. They are saved with your collection and added to a review request; the guide does not rank teams by them.','Opcional. Copie da tela do personagem no jogo. Eles ficam salvos com a sua coleção e entram no pedido de análise; o guia não classifica equipes por eles.','Opcional. Cópialas de la pantalla del personaje en el juego. Se guardan con tu colección y se añaden a la solicitud de revisión; la guía no ordena equipos según ellas.'],
['Enter a whole number, or leave it empty.','Digite um número inteiro ou deixe em branco.','Escribe un número entero o déjalo vacío.'],
['Ask someone to check your teams','Peça para alguém conferir suas equipes','Pide a alguien que revise tus equipos'],
['Want a second opinion? This gathers your owned characters, stars, stats and notes into text you can send to a guildmate or helper. The guide does not read screenshots; you can preview them here, then attach them yourself.','Quer uma segunda opinião? Isto junta seus personagens, estrelas, status e notas num texto para enviar a alguém da guild ou a quem for ajudar. O guia não lê capturas de tela; você pode vê-las aqui e depois anexá-las você mesmo.','¿Quieres una segunda opinión? Esto reúne tus personajes, estrellas, estadísticas y notas en un texto para enviar a alguien de tu guild o a quien te ayude. La guía no lee capturas de pantalla; puedes verlas aquí y luego adjuntarlas tú.'],
['Screenshots (up to 6, preview only)','Capturas de tela (até 6, só para ver)','Capturas de pantalla (hasta 6, solo para ver)'],
['Clear screenshots','Limpar capturas','Borrar capturas'],
['What do you need help with?','Com o que você precisa de ajuda?','¿Con qué necesitas ayuda?'],
['Mode, enemy team, your budget, what you want to beat…','Modo, equipe inimiga, seu orçamento, o que você quer vencer…','Modo, equipo enemigo, tu presupuesto, lo que quieres vencer…'],
['Copy review request','Copiar pedido de análise','Copiar solicitud de revisión'],
['Review request text','Texto do pedido de análise','Texto de la solicitud de revisión'],
['Copied. Paste it with your screenshots to a guildmate or helper.','Copiado. Cole junto com suas capturas para alguém da guild ou quem for ajudar.','Copiado. Pégalo junto con tus capturas para alguien de tu guild o quien te ayude.'],
['Select the text below and copy it.','Selecione o texto abaixo e copie.','Selecciona el texto de abajo y cópialo.'],
['Please check my Tokyo Ghoul: Break the Chains teams.','Você pode conferir minhas equipes de Tokyo Ghoul: Break the Chains?','¿Puedes revisar mis equipos de Tokyo Ghoul: Break the Chains?'],
['Server','Servidor','Servidor'],['day','dia','día'],['Characters I own','Personagens que tenho','Personajes que tengo'],
['none marked yet','nenhum marcado ainda','ninguno marcado todavía'],['What I need','O que eu preciso','Lo que necesito'],
['I will attach my screenshots separately.','Vou anexar minhas capturas separadamente.','Adjuntaré mis capturas por separado.'],
['Compare your own offers →','Compare as suas ofertas →','Compara tus propias ofertas →'],
['Login rewards you will really get','Recompensas de login que você vai receber de fato','Recompensas de login que recibirás de verdad'],
['For a login contract or sign-in track: count only the days you will actually claim.','Para um contrato de login ou trilha de login: conte só os dias em que você vai mesmo resgatar.','Para un contrato de login o un registro diario: cuenta solo los días que de verdad vas a reclamar.'],
['A missed day is usually lost, not added at the end. Check the claim rules and the end date in game.','Um dia perdido costuma ficar perdido, não vai para o final. Confira as regras de resgate e a data de término no jogo.','Un día perdido suele perderse, no se añade al final. Revisa las reglas de reclamo y la fecha de fin en el juego.'],
['Diamonds you get at once','Diamonds que você recebe na hora','Diamonds que recibes al momento'],['Diamonds per claimed day','Diamonds por dia resgatado','Diamonds por día reclamado'],
['Days in the contract','Dias do contrato','Días del contrato'],['Days you will claim','Dias que você vai resgatar','Días que vas a reclamar'],
['Enter the rewards and the days from your game.','Digite as recompensas e os dias do seu jogo.','Escribe las recompensas y los días de tu juego.'],
['Days you will claim cannot be more than the days in the contract.','Os dias que você vai resgatar não podem passar dos dias do contrato.','Los días que vas a reclamar no pueden superar los días del contrato.'],
['Diamonds only (no tickets): none in this offer.','Só Diamonds (sem tickets): esta oferta não tem.','Solo Diamonds (sin tickets): esta oferta no tiene.'],
["This guide is being updated with new research. Sections update as they're checked. Fully updated by Fri Oct 30, 2026.", "Este guia está sendo atualizado com novas pesquisas. As seções mudam conforme são conferidas. Atualização completa até sex., 30 de out. de 2026.", "Esta guía se está actualizando con nuevas investigaciones. Las secciones cambian a medida que se revisan. Actualización completa para el vie. 30 de oct. de 2026."],
];
const COL = {pt: 1, es: 2};
const D = new Map();
if (lang !== 'en') for (const r of T) D.set(r[0], r[COL[lang]]);

const FIELDS = ['Stake','Total returned','Cost per pull','Guarantee threshold','Eligible pulls already made','Available diamonds','Eligible tickets','Target rate','Number of pulls','Pack price','Pack diamonds','Pack tickets','Assumed diamond value per ticket','Collection days','Purchase cap','Current balance','Net daily income','Target','Planned copies','Cash budget','Diamonds you get at once','Diamonds per claimed day','Days in the contract','Days you will claim'].join('|');
const pick = (pt, es) => lang === 'pt' ? pt : es;
const WHY = s => s.split(', ').map(w => ({'same faction': pick('mesma facção', 'misma facción'), 'same attribute': pick('mesmo atributo', 'mismo atributo'), 'same role': pick('mesma função', 'mismo rol')})[w] || w).join(', ');
const ADVICE = {'build your team around it': ['monte sua equipe em volta dela', 'arma tu equipo alrededor de ella'], 'it is strong in the right team': ['ela é forte na equipe certa', 'es fuerte en el equipo adecuado'], 'it is useful but limited': ['ela é útil, mas limitada', 'es útil pero limitada'], 'only level it': ['só suba o nível dela', 'solo súbela de nivel'], 'skip it': ['pule', 'sáltala']};
const adv = a => (ADVICE[a] || [a, a])[lang === 'pt' ? 0 : 1];
const or = s => s.replace(/ or /g, pick(' ou ', ' o '));
/* [pattern, Português, Español]: "$1" keeps a captured piece as is, "%1" translates it through the table first;
   a function gets (match, tr). Captured pieces are names, numbers or text already translated in the data. */
const P = [
 [/^Passive (\d) · unlock star not confirmed$/, 'Passiva $1 · estrela de liberação não confirmada', 'Pasiva $1 · estrella de desbloqueo sin confirmar'],
 [/^Back-up: none of (.+)’s skills say they work from back-up, so this slot only helps once it enters the field\.$/, 'Back-up: nenhuma skill de $1 diz que funciona no back-up, então esta vaga só ajuda quando entra em campo.', 'Back-up: ninguna habilidad de $1 dice que funcione desde el back-up, así que esta casilla solo ayuda cuando entra al campo.'],
 [/^Passive stars not confirmed for (.+): check the star preview in game\.$/, 'Estrelas das passivas não confirmadas para $1: confira a prévia de estrelas no jogo.', 'Estrellas de las pasivas sin confirmar para $1: revisa la vista previa de estrellas en el juego.'],
 [/^Which version of (.+)\?$/, 'Qual versão de $1?', '¿Qué versión de $1?'],
 [/^(\d+) screenshot\(s\) shown here only\. They are not saved or sent\.$/, '$1 captura(s) só nesta tela. Elas não são salvas nem enviadas.', '$1 captura(s) solo en esta pantalla. No se guardan ni se envían.'],
 [/^You collect (.+) of (.+) diamonds · (.+) lost to missed days\.$/, 'Você recebe $1 de $2 Diamonds · $3 perdidos em dias sem resgate.', 'Recibes $1 de $2 Diamonds · $3 perdidos por días sin reclamar.'],
 [/^Diamonds only \(no tickets\): (.+) per 1 ([A-Z]{3}) · (.+) per 1,000 Diamonds\.$/, 'Só Diamonds (sem tickets): $1 por 1 $2 · $3 por 1.000 Diamonds.', 'Solo Diamonds (sin tickets): $1 por 1 $2 · $3 por 1.000 Diamonds.'],
 [new RegExp('^(' + FIELDS + ') is too large\\.$'), '%1: valor grande demais.', '%1: valor demasiado grande.'],
 [/^(.+) · (\d{4}-\d{2}-\d{2})$/, '%1 · $2', '%1 · $2'], [/^(.+) · no date$/, '%1 · sem data', '%1 · sin fecha'],
 [/^Tokyo Ghoul · (.+)$/, 'Tokyo Ghoul · %1', 'Tokyo Ghoul · %1'],
 [/^Source: (.+)$/s, 'Fonte: $1', 'Fuente: $1'],
 [/^Source of the tags: (.+)$/s, 'Fonte das etiquetas: $1', 'Fuente de las etiquetas: $1'],
 [/^Date: (.+)$/, 'Data: $1', 'Fecha: $1'],[/^Region: (.+)$/, 'Região: %1', 'Región: %1'],
 [/^(.+) · day (\d+) · (\d+) owned →$/, '%1 · dia $2 · $3 na coleção →', '%1 · día $2 · $3 en tu colección →'],
 [/^Your server: (.+) · day (\d+)\.$/, 'Seu servidor: %1 · dia $2.', 'Tu servidor: %1 · día $2.'],
 [/^Day (\d+) · (.+)$/, 'Dia $1 · %2', 'Día $1 · %2'],[/^DAY (\d+)$/, 'DIA $1', 'DÍA $1'],
 [/^STEP (\d+) OF (\d+)$/, 'PASSO $1 DE $2', 'PASO $1 DE $2'],[/^FIELD (\d+)$/, 'CAMPO $1', 'CAMPO $1'],[/^RESERVE (\d+)$/, 'RESERVA $1', 'RESERVA $1'],
 [/^Character in slot (\d+)$/, 'Personagem no espaço $1', 'Personaje en la casilla $1'],
 [/^Owned · (\d)★$/, 'Na coleção · $1★', 'En tu colección · $1★'],
 [/^(\d+) of (\d+) characters$/, '$1 de $2 personagens', '$1 de $2 personajes'],[/^(\d+) of (\d+) owned$/, '$1 de $2 na coleção', '$1 de $2 en tu colección'],
 [/^(\d+) teams$/, '$1 equipes', '$1 equipos'],[/^(\d+) videos$/, '$1 vídeos', '$1 videos'],[/^(\d+) results$/, '$1 resultados', '$1 resultados'],
 [/^Tick your characters \((\d+)\)$/, 'Marque seus personagens ($1)', 'Marca tus personajes ($1)'],
 [/^And (\d+) more fights\.$/, 'E mais $1 lutas.', 'Y $1 peleas más.'],
 [/^Use for: (.+?)(?: and (\d+) more)?$/s, (m) => pick('Usar em: ', 'Usar en: ') + m[1] + (m[2] ? pick(' e mais ', ' y ') + m[2] + pick('', ' más') : '')],
 [/^Missing: (.+)\.$/, 'Falta: $1.', 'Falta: $1.'],
 [/^(.+) \(((?:same (?:faction|attribute|role)(?:, )?)+)\)$/, m => m[1] + ' (' + WHY(m[2]) + ')'],
 [/^No (.+?)\? Use (.+)\.$/s, m => pick('Sem ', '¿No tienes a ') + m[1] + pick('? Use ', '? Usa ') + or(m[2]) + '.'],
 [/^start from “(.+?)” and replace (.+)\.$/s, m => pick('comece por “', 'empieza por “') + m[1] + pick('” e troque ', '” y cambia ') + m[2].replace(/ with /g, pick(' por ', ' por ')).replace(/, then /g, pick(', depois ', ', luego ')) + '.'],
 [/^(.+) All teams below\.$/s, m => m[1] + pick(' Todas as equipes abaixo.', ' Todos los equipos de abajo.')],
 [/^(No Organization|Aogiri Tree|Anteiku|CCG) teams$/, 'Equipes $1', 'Equipos $1'],
 [/^(.+) meta team →$/, 'Equipe meta $1 →', 'Equipo meta $1 →'],
 [/^Watch: (.+) ↗$/s, 'Assistir: $1 ↗', 'Ver: $1 ↗'],
 [/^Nobody has tested this order in a fight\. (.+)$/s, 'Ninguém testou esta ordem numa luta. $1', 'Nadie ha probado este orden en una pelea. $1'],
 [/^Prices as of (.+)\.$/, 'Preços de $1.', 'Precios del $1.'],
 [/^How to get: (.+?) \((Starter|Mid|Endgame)\)(?:\. Window over\? (.+))?$/s, m => pick('Como conseguir: ', 'Cómo conseguir: ') + m[1] + ' (' + tr(m[2]) + ')' + (m[3] ? pick('. Janela encerrada? ', '. ¿Ventana cerrada? ') + m[3] : '')],
 [/^How to get: (.+)$/s, 'Como conseguir: $1', 'Cómo conseguir: $1'],[/^How to get it: (.+)$/s, 'Como conseguir: %1', 'Cómo conseguir: %1'],
 [/^From the tier list: (.+)$/s, 'Pela tier list: $1', 'Según la tier list: $1'],
 [/^At 0★ and at full stars \(([SABCD])\), (.+)\.$/, m => pick('Com 0★ e com estrelas máximas (', 'Con 0★ y con estrellas máximas (') + m[1] + '), ' + adv(m[2]) + '.'],
 [/^At 0★ \(([SABCD])\), (.+); at full stars \(([SABCD])\), (.+)\.$/, m => pick('Com 0★ (', 'Con 0★ (') + m[1] + '), ' + adv(m[2]) + pick('; com estrelas máximas (', '; con estrellas máximas (') + m[3] + '), ' + adv(m[4]) + '.'],
 [/^Role: (.+)$/, m => pick('Função: ', 'Rol: ') + m[1].split(', ').map(tr).join(', ')],
 [/^Also called: (.+)$/s, 'Também chamado: $1', 'También llamado: $1'],
 [/^Rarity: (\S+) in the old guide; the game text may call it SP\. Check in game\.$/, 'Raridade: $1 no guia antigo; o texto do jogo pode chamá-la de SP. Confira no jogo.', 'Rareza: $1 en la guía antigua; el texto del juego puede llamarla SP. Revisa en el juego.'],
 [/^(.+) — source URL unavailable$/, '$1 — link da fonte indisponível', '$1 — enlace de la fuente no disponible'],
 [/^Field faction counts: (.+)$/, 'Facções em campo: %1', 'Facciones en el campo: %1'],
 [/^Missing from your recorded collection: (.+)$/s, 'Fora da sua coleção registrada: %1', 'Fuera de tu colección registrada: %1'],
 [/^1 character has no portrait yet and shows a placeholder instead: (.+) \(not released; the game files have no art for it\)\.$/, '1 personagem ainda não tem retrato e mostra um marcador no lugar: $1 (não lançado; os arquivos do jogo não têm arte para ele).', '1 personaje aún no tiene retrato y muestra un marcador en su lugar: $1 (no lanzado; los archivos del juego no tienen arte para él).'],
 [/^(\d+) characters have no portrait yet and show a placeholder instead\.$/, '$1 personagens ainda não têm retrato e mostram um marcador no lugar.', '$1 personajes aún no tienen retrato y muestran un marcador en su lugar.'],
 [/^When: (.+)$/s, 'Quando: %1', 'Cuándo: %1'],[/^Uses: (.+)$/, 'Usa: $1', 'Usa: $1'],
 [/^(.+) · your fight$/, '$1 · sua luta', '$1 · tu pelea'],
 [/^Unlock: (.+)$/s, 'Desbloqueio: %1', 'Desbloqueo: %1'],[/^Team note from the old guide: (.+)$/s, 'Nota de equipe do guia antigo: %1', 'Nota de equipo de la guía antigua: %1'],
 [/^Attribute: (.+)$/, 'Atributo: $1', 'Atributo: $1'],
 [/^Ability sphere for (.+)$/s, 'Esfera de habilidade de $1', 'Esfera de habilidad de $1'],
 [/^(.+) · Date not recorded$/, '$1 · data não registrada', '$1 · fecha sin registrar'],
 [/^Character · (.+)$/, 'Personagem · $1', 'Personaje · $1'],[/^Video · (.+)$/, 'Vídeo · $1', 'Video · $1'],
 [/^Import rejected: (.+)$/, 'Importação recusada: %1', 'Importación rechazada: %1'],
 [/^(?:Added: (.+?)\.)?(?: ?Not found: (.+)\.)?$/, m => (m[1] || m[2]) ? (m[1] ? pick('Adicionados: ', 'Añadidos: ') + m[1] + '.' : '') + (m[2] ? (m[1] ? ' ' : '') + pick('Não encontrados: ', 'No encontrados: ') + m[2] + '.' : '') : m[0]],
 // tools
 [/^Observations stay in this browser\. Region: (.+)\. Use Clear calculator observations to delete them\.$/, 'As anotações ficam neste navegador. Região: %1. Use Limpar anotações das calculadoras para apagá-las.', 'Las notas se quedan en este navegador. Región: %1. Usa Borrar notas de las calculadoras para eliminarlas.'],
 [/^(.+) diamonds · (.+)% return per 48-hour cycle\.$/, '$1 Diamonds · retorno de $2% por ciclo de 48 horas.', '$1 Diamonds · retorno del $2% por ciclo de 48 horas.'],
 [/^48-hour mark: (.+) \(UTC: (.+)\)\. (.+)$/, 'Marca de 48 horas: $1 (UTC: $2). %3', 'Marca de 48 horas: $1 (UTC: $2). %3'],
 [/^(\d+) pulls remaining · (\d+) eligible tickets used · (.+) diamonds required · (.+) shortfall\. Conditional on the rules you entered\.$/, '$1 pulls restantes · $2 tickets válidos usados · $3 Diamonds necessários · faltam $4. Depende das regras que você digitou.', '$1 pulls restantes · $2 tickets válidos usados · $3 Diamonds necesarios · faltan $4. Depende de las reglas que introdujiste.'],
 [/^(.+)% chance of at least one target in (\d+) independent pulls \(pity excluded\)\.$/, '$1% de chance de pelo menos uma unidade alvo em $2 pulls independentes (sem pity).', '$1% de probabilidad de al menos una unidad objetivo en $2 pulls independientes (sin pity).'],
 [/^(.+) per 1,000 assumed diamond-equivalents · (.+) total per purchase · collected over (\d+) (days?)\. (Recurring billing\. |One-time offer as entered\. )(.+)$/, m => m[1] + pick(' por 1.000 Diamonds equivalentes presumidos · ', ' por 1.000 Diamonds equivalentes supuestos · ') + m[2] + pick(' no total por compra · coletados em ', ' en total por compra · recogidos en ') + m[3] + (m[4] === 'day' ? pick(' dia. ', ' día. ') : pick(' dias. ', ' días. ')) + (m[5].startsWith('R') ? pick('Cobrança recorrente. ', 'Cobro recurrente. ') : pick('Oferta única, como digitada. ', 'Oferta única, tal como se introdujo. ')) + (m[6].startsWith('Note') ? pick('Nota salva. Esta ferramenta não a confere.', 'Nota guardada. Esta herramienta no la comprueba.') : pick('Adicione uma nota e a data em que conferiu.', 'Añade una nota y la fecha en que lo revisaste.'))],
 [/^(Plan: (.+) \/ (.+) budget · (.+) assumed diamond-equivalents\. (?:Over budget by (.+)\.|Unspent budget: (.+)\.)|Zero-purchase plan: (.+)\. No paid offer selected\.)( Compare cost per 1,000 above only after checking reward eligibility and caps\.| Offers have different or missing region\/date\/ticket assumptions; no best-value ranking is shown\.)?$/, m =>
   (m[7] !== undefined ? pick('Plano sem compras: ', 'Plan sin compras: ') + m[7] + pick('. Nenhuma oferta paga escolhida.', '. Ninguna oferta de pago elegida.')
    : pick('Plano: ', 'Plan: ') + m[2] + ' / ' + m[3] + pick(' de orçamento · ', ' de presupuesto · ') + m[4] + pick(' Diamonds equivalentes presumidos. ', ' Diamonds equivalentes supuestos. ') + (m[5] !== undefined ? pick('Acima do orçamento em ', 'Por encima del presupuesto en ') + m[5] + '.' : pick('Orçamento não gasto: ', 'Presupuesto sin gastar: ') + m[6] + '.'))
   + (m[8] ? (m[8].includes('Compare') ? pick(' Compare o custo por 1.000 acima só depois de conferir a validade das recompensas e os limites.', ' Compara el coste por 1.000 de arriba solo después de revisar la validez de las recompensas y los límites.') : pick(' As ofertas têm região, data ou valor de ticket diferentes ou faltando; nenhum ranking de melhor valor é mostrado.', ' Las ofertas tienen región, fecha o valor de ticket distintos o sin indicar; no se muestra ningún ranking de mejor valor.')) : '')],
 [/^(.+) diamonds needed · approximately (\d+) days at this constant income\.$/, 'Faltam $1 Diamonds · cerca de $2 dias com essa renda constante.', 'Faltan $1 Diamonds · unos $2 días con estos ingresos constantes.'],
 [new RegExp('^(' + FIELDS + ') is required\\.$'), '%1: obrigatório.', '%1: obligatorio.'],
 [new RegExp('^(' + FIELDS + ') must be a (positive|non-negative) (whole number|number)\\.$'), m => tr(m[1]) + pick(' deve ser um ', ' debe ser un ') + (m[3] === 'number' ? 'número' : pick('número inteiro', 'número entero')) + ' ' + (m[2] === 'positive' ? 'positivo' : pick('não negativo', 'no negativo')) + '.'],
];

function tr(s) {
 if (lang === 'en' || !s) return s;
 const hit = D.get(s); if (hit !== undefined) return hit;
 for (const [re, a, b] of P) {
  const m = re.exec(s); if (!m) continue;
  const f = typeof a === 'function' ? a : (lang === 'pt' ? a : b);
  return typeof f === 'function' ? f(m, tr) : f.replace(/([$%])(\d)/g, (_, k, i) => k === '$' ? (m[i] || '') : tr(m[i] || ''));
 }
 return s;
}

const SKIP = 'script,style,textarea,.lang-switch,.lang-offer,.uname,[data-no-i18n]';
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const done = new WeakMap();
function textNode(n) {
 const v = n.nodeValue; if (done.get(n) === v) return;
 const s = v.trim(); if (!s || !/[A-Za-z]/.test(s)) return;
 const p = n.parentElement; if (p && p.closest(SKIP)) return;
 const out = tr(s);
 if (out !== s) { const nv = v.replace(s, () => out); done.set(n, nv); n.nodeValue = nv; } else done.set(n, v);
}
const SKIP_ATTR = '.lang-switch,.lang-offer,.uname,[data-no-i18n]';
function element(e) {
 if (e.closest(SKIP_ATTR)) return;
 for (const a of ATTRS) { const v = e.getAttribute(a); if (v && /[A-Za-z]/.test(v)) { const out = tr(v); if (out !== v) e.setAttribute(a, out); } }
}
function walk(root) {
 if (root.nodeType === 3) return textNode(root);
 if (root.nodeType !== 1) return;
 element(root);
 const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
 while ((n = w.nextNode())) n.nodeType === 3 ? textNode(n) : element(n);
}
function observe() {
 walk(document.head.querySelector('title') || document.head); walk(document.body);
 new MutationObserver(ms => { for (const m of ms) {
  if (m.type === 'characterData') textNode(m.target);
  else if (m.type === 'attributes') element(m.target);
  else m.addedNodes.forEach(walk);
 } }).observe(document.documentElement, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS});
}

function choose(v) { write(v); if (v !== lang) location.reload(); }
function switcher(cls) {
 const box = document.createElement('div'); box.className = 'lang-switch ' + cls; box.setAttribute('role', 'group');
 box.setAttribute('aria-label', lang === 'en' ? 'Language' : D.get('Language'));
 for (const l of LANGS) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = l.toUpperCase(); b.lang = l === 'pt' ? 'pt-BR' : l;
  b.title = NAMES[l]; b.setAttribute('aria-label', NAMES[l]); b.setAttribute('aria-pressed', String(l === lang)); b.dataset.lang = l;
  b.addEventListener('click', () => choose(l)); box.append(b);
 }
 return box;
}
/* Offered once, on a first visit from a Portuguese or Spanish browser. Either answer is remembered. */
function offer() {
 if (read() !== null) return;
 const nav = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
 const want = nav.startsWith('pt') ? 'pt' : nav.startsWith('es') ? 'es' : null;
 if (!want) return;
 const bar = document.createElement('div'); bar.className = 'lang-offer'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', NAMES[want]); bar.lang = want === 'pt' ? 'pt-BR' : 'es';
 const q = document.createElement('p'); q.textContent = want === 'pt' ? 'Ver em português?' : '¿Ver en español?';
 const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'primary'; yes.textContent = want === 'pt' ? 'Sim, português' : 'Sí, español';
 const no = document.createElement('button'); no.type = 'button'; no.textContent = 'No, English'; no.lang = 'en';
 yes.addEventListener('click', () => choose(want));
 no.addEventListener('click', () => { write('en'); bar.remove(); });
 bar.append(q, yes, no);
 const header = document.querySelector('header'); if (header) header.after(bar); else document.body.prepend(bar);
}
function mountUI() {
 const header = document.querySelector('header'), acct = header && header.querySelector('.account-link');
 if (header) header.insertBefore(switcher('in-header'), acct || null);
 const bar = document.querySelector('.contextbar'); if (bar) bar.insertBefore(switcher('in-bar'), bar.lastElementChild);
 offer();
}

/* app.js starts through ready(): in PT/ES it waits for data.<lang>.js, then reads the translated guide. */
function ready(start) {
 const go = () => { try { mountUI(); } catch (e) { console.error(e); } if (lang !== 'en') observe(); start(); };
 if (lang === 'en') return go();
 const s = document.createElement('script'); s.src = 'data.' + lang + '.js';
 s.onload = () => { const pack = (window.TGDATA_I18N || {})[lang]; if (pack && pack.guide && window.TGDATA) window.TGDATA.guide = pack.guide; if (pack && pack.strings) for (const k in pack.strings) if (!D.has(k)) D.set(k, pack.strings[k]); go(); };
 s.onerror = () => { lang = 'en'; document.documentElement.lang = 'en'; D.clear(); go(); };
 document.head.append(s);
}
return {get lang() { return lang; }, t: tr, ready, choose};
})();
