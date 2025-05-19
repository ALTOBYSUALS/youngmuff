// REPRODUCTOR PERSISTENTE - YOUNG MUFF
// Este script debe incluirse en todas las páginas para mantener el reproductor

// Variables globales para compartir entre instancias
window.youngMuffPlayer = window.youngMuffPlayer || {
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  audioElement: null,
  tracks: [],
  initialized: false
};

// Función para sincronizar el estado entre páginas
function syncPlayerState() {
  try {
    const storedState = localStorage.getItem('player_state');
    if (storedState) {
      const playerState = JSON.parse(storedState);
      window.youngMuffPlayer.currentIndex = playerState.trackIndex || 0;
      window.youngMuffPlayer.isPlaying = playerState.isPlaying || false;
      window.youngMuffPlayer.currentTime = playerState.currentTime || 0;
      console.log("🔄 Estado sincronizado:", window.youngMuffPlayer);
    }
  } catch (e) {
    console.error("❌ Error sincronizando estado:", e);
  }
  
  // Programar la próxima sincronización en 1 segundo
  setTimeout(syncPlayerState, 1000);
}

// Iniciar sincronización
syncPlayerState();

// Guardar estado compartido
function saveSharedState() {
  try {
    const playerState = {
      trackIndex: window.youngMuffPlayer.currentIndex,
      isPlaying: window.youngMuffPlayer.isPlaying,
      currentTime: window.youngMuffPlayer.currentTime || 0
    };
    localStorage.setItem('player_state', JSON.stringify(playerState));
  } catch (e) {
    console.error("❌ Error guardando estado compartido:", e);
  }
}

// Evento de almacenamiento para sincronizar entre ventanas/pestañas
window.addEventListener('storage', function(e) {
  if (e.key === 'player_state') {
    syncPlayerState();
    
    // Actualizar el reproductor activo si existe
    if (window.trueMediaPlayerInst) {
      updateTrueMediaPlayer();
    }
  }
});

// Guardar estado al salir
window.addEventListener('beforeunload', function() {
  saveSharedState();
});

// Función para redirigir a la página principal si no hay reproductor
function redirectToMainPage() {
  // Verificar si estamos en la página principal o en la página de ropa
  if (!window.location.pathname.includes('index.html') && 
      !window.location.pathname.includes('ropa.html') &&
      window.location.pathname !== '/' && 
      window.location.pathname !== '') {
    
    // Solo redirigir si no estamos en la página de ropa o principal
    if (localStorage.getItem('player_state')) {
      try {
        syncPlayerState();
        
        // Redireccionar a la página principal con un parámetro para activar la canción
        window.location.href = '/index.html?play=' + window.youngMuffPlayer.currentIndex + 
                              '&time=' + window.youngMuffPlayer.currentTime + 
                              '&state=' + (window.youngMuffPlayer.isPlaying ? 'play' : 'pause');
      } catch (e) {
        console.error("❌ Error al redireccionar:", e);
        window.location.href = '/index.html';
      }
    } else {
      // Si no hay estado, simplemente redirigir a la página principal
      window.location.href = '/index.html';
    }
  }
}

// Actualizar el TrueMediaPlayer según el estado global
function updateTrueMediaPlayer() {
  if (!window.trueMediaPlayerInst) return;
  
  // Verificar si hay pistas y elementos de audio
  const trackElements = document.querySelectorAll('[tmplayer-parent="true-media-player"]');
  if (!trackElements.length) return;
  
  // Encontrar la pista actual
  const currentTrack = trackElements[window.youngMuffPlayer.currentIndex];
  if (!currentTrack) return;
  
  // Encontrar el botón de toggle y el audio
  const toggleButton = currentTrack.querySelector('[tmplayer-action="toggle"]');
  if (!toggleButton) return;
  
  // Aplicar cambios al reproductor
  setTimeout(() => {
    const audioElements = document.querySelectorAll('audio');
    
    // Si hay elementos de audio, actualizar el que corresponde a la pista actual
    if (audioElements.length > 0) {
      const currentAudio = audioElements[window.youngMuffPlayer.currentIndex];
      if (currentAudio) {
        // Actualizar la posición de reproducción si difiere significativamente
        if (Math.abs(currentAudio.currentTime - window.youngMuffPlayer.currentTime) > 2) {
          currentAudio.currentTime = window.youngMuffPlayer.currentTime;
        }
        
        // Reproducir o pausar según el estado
        if (window.youngMuffPlayer.isPlaying && currentAudio.paused) {
          currentAudio.play().catch(e => console.log("Error al reproducir:", e));
        } else if (!window.youngMuffPlayer.isPlaying && !currentAudio.paused) {
          currentAudio.pause();
        }
      }
    }
  }, 300);
}

// Verificar si estamos en la página principal y hay que inicializar el reproductor
document.addEventListener('DOMContentLoaded', function() {
  const mainPlayer = document.querySelector('.main-media-player');
  
  // Si no estamos en una página con el reproductor, llamar a la función de redirección
  // (ahora no redirigirá desde la página de ropa)
  if (!mainPlayer) {
    redirectToMainPage();
    return;
  }
  
  // En la página principal, verificar parámetros de URL para reproducción
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('play')) {
    const trackIndex = parseInt(urlParams.get('play'));
    const trackTime = parseFloat(urlParams.get('time'));
    const playState = urlParams.get('state');
    
    // Actualizar el estado global
    window.youngMuffPlayer.currentIndex = trackIndex;
    window.youngMuffPlayer.currentTime = trackTime;
    window.youngMuffPlayer.isPlaying = playState === 'play';
    
    // Limpiar los parámetros de la URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Verificar periódicamente si TrueMediaPlayer está inicializado
  const trueMediaPlayerCheck = setInterval(() => {
    if (window.trueMediaPlayerInst) {
      clearInterval(trueMediaPlayerCheck);
      
      // Escuchar eventos del reproductor para actualizar el estado global
      document.addEventListener('tmplayer:play', function() {
        window.youngMuffPlayer.isPlaying = true;
        saveSharedState();
      });
      
      document.addEventListener('tmplayer:pause', function() {
        window.youngMuffPlayer.isPlaying = false;
        saveSharedState();
      });
      
      document.addEventListener('tmplayer:timeupdate', function(e) {
        if (e && e.detail && e.detail.currentTime !== undefined) {
          window.youngMuffPlayer.currentTime = e.detail.currentTime;
          // Guardar cada 5 segundos para no sobrecargar
          if (Math.floor(e.detail.currentTime) % 5 === 0) {
            saveSharedState();
          }
        }
      });
      
      document.addEventListener('tmplayer:trackchange', function(e) {
        if (e && e.detail && e.detail.trackIndex !== undefined) {
          window.youngMuffPlayer.currentIndex = e.detail.trackIndex;
          saveSharedState();
        }
      });
      
      // Actualizar el reproductor con el estado guardado
      updateTrueMediaPlayer();
    }
  }, 200);
}); 