// REPRODUCTOR PERSISTENTE - YOUNG MUFF
// Este script debe incluirse en todas las páginas para mantener el reproductor

// Verificar si estamos en una página que no sea el reproductor principal
if (!document.querySelector('.main-media-player')) {
  // Crear el reproductor si no existe en esta página
  (function createPersistentPlayer() {
    // Verificar si hay estado guardado
    if (!localStorage.getItem('player_state')) {
      console.log("⏭️ No hay estado del reproductor guardado, omitiendo inicialización");
      return;
    }
    
    let playerState;
    try {
      playerState = JSON.parse(localStorage.getItem('player_state'));
    } catch (e) {
      console.error("❌ Error al recuperar estado del reproductor:", e);
      return;
    }
    
    // Crear el reproductor flotante
    const playerContainer = document.createElement('div');
    playerContainer.className = 'floating-player';
    playerContainer.innerHTML = `
      <div class="floating-player-inner">
        <div class="player-controls">
          <button id="floatingPrevBtn">⏮️</button>
          <button id="floatingPlayBtn">▶️</button>
          <button id="floatingPauseBtn" style="display:none">⏸️</button>
          <button id="floatingNextBtn">⏭️</button>
        </div>
        <div class="player-info">
          <div id="floatingTrackTitle"></div>
          <div class="progress-container">
            <div id="floatingProgress"></div>
          </div>
        </div>
        <button id="floatingBackBtn">🏠</button>
      </div>
    `;
    
    document.body.appendChild(playerContainer);
    
    // Estilos para el reproductor flotante
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .floating-player {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #000;
        color: white;
        z-index: 9999;
        padding: 10px;
        border-top: 1px solid #333;
      }
      .floating-player-inner {
        display: flex;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
      }
      .player-controls {
        display: flex;
        gap: 10px;
        margin-right: 15px;
      }
      .player-controls button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: white;
      }
      .player-info {
        flex: 1;
      }
      #floatingTrackTitle {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .progress-container {
        width: 100%;
        height: 5px;
        background-color: #333;
      }
      #floatingProgress {
        height: 100%;
        background-color: red;
        width: 0%;
      }
      #floatingBackBtn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: white;
        margin-left: 15px;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Cargar datos de canciones
    fetch('/tracks.json')
      .then(response => response.json())
      .then(tracks => {
        // Obtener elementos del DOM
        const playBtn = document.getElementById('floatingPlayBtn');
        const pauseBtn = document.getElementById('floatingPauseBtn');
        const prevBtn = document.getElementById('floatingPrevBtn');
        const nextBtn = document.getElementById('floatingNextBtn');
        const backBtn = document.getElementById('floatingBackBtn');
        const trackTitle = document.getElementById('floatingTrackTitle');
        const progressBar = document.getElementById('floatingProgress');
        
        // Configurar estado inicial
        let currentIndex = playerState.trackIndex || 0;
        let isPlaying = playerState.isPlaying || false;
        let audioElement = new Audio(tracks[currentIndex].audioUrl);
        audioElement.currentTime = playerState.currentTime || 0;
        
        // Actualizar título
        trackTitle.textContent = tracks[currentIndex].title;
        
        // Inicializar controles
        if (isPlaying) {
          playBtn.style.display = 'none';
          pauseBtn.style.display = 'block';
          audioElement.play();
        } else {
          playBtn.style.display = 'block';
          pauseBtn.style.display = 'none';
        }
        
        // Eventos de reproducción
        playBtn.addEventListener('click', function() {
          audioElement.play();
          playBtn.style.display = 'none';
          pauseBtn.style.display = 'block';
          isPlaying = true;
          updatePlayerState();
        });
        
        pauseBtn.addEventListener('click', function() {
          audioElement.pause();
          pauseBtn.style.display = 'none';
          playBtn.style.display = 'block';
          isPlaying = false;
          updatePlayerState();
        });
        
        // Navegación entre canciones
        prevBtn.addEventListener('click', function() {
          changeTrack(currentIndex - 1 < 0 ? tracks.length - 1 : currentIndex - 1);
        });
        
        nextBtn.addEventListener('click', function() {
          changeTrack(currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1);
        });
        
        // Volver a la página principal
        backBtn.addEventListener('click', function() {
          window.location.href = '/index.html';
        });
        
        // Actualizar progreso
        audioElement.addEventListener('timeupdate', function() {
          const percent = (audioElement.currentTime / audioElement.duration) * 100;
          progressBar.style.width = `${percent}%`;
          
          // Guardar tiempo actual periódicamente
          if (Math.floor(audioElement.currentTime) % 5 === 0) {
            updatePlayerState();
          }
        });
        
        // Cambiar de canción al terminar
        audioElement.addEventListener('ended', function() {
          changeTrack(currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1);
        });
        
        // Función para cambiar de canción
        function changeTrack(index) {
          currentIndex = index;
          
          // Guardar tiempo actual
          updatePlayerState();
          
          // Parar reproducción actual
          audioElement.pause();
          
          // Actualizar título y fuente de audio
          trackTitle.textContent = tracks[currentIndex].title;
          audioElement.src = tracks[currentIndex].audioUrl;
          
          // Reproducir si estaba reproduciendo
          if (isPlaying) {
            audioElement.play();
          }
          
          updatePlayerState();
        }
        
        // Guardar estado
        function updatePlayerState() {
          const newState = {
            trackIndex: currentIndex,
            isPlaying: isPlaying,
            currentTime: audioElement.currentTime || 0
          };
          localStorage.setItem('player_state', JSON.stringify(newState));
        }
        
        // Guardar estado al salir
        window.addEventListener('beforeunload', function() {
          updatePlayerState();
        });
      })
      .catch(error => {
        console.error("❌ Error cargando tracks.json:", error);
      });
  })();
} 