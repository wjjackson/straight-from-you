async function loadAllVideos() {
  const rawInput = document.getElementById('videoIdsInput').value.trim();
  const videoIds = rawInput.split('\n').map(id => id.trim()).filter(Boolean);

  const container = document.getElementById('cardsContainer');
  container.innerHTML = '';

  for (let vid of videoIds) {
    const comments = await fetchTopComments(vid);
    comments.forEach((data, index) => {
      const { username, avatar, comment } = data;

      const card = document.createElement('div');
      card.className = 'comment-card';
      card.id = `card-${vid}-${index}`;

      card.innerHTML = `
        <input type="checkbox" class="export-check">
        <div class="card-header">
          <div class="avatar"><img src="${avatar}" alt="" aria-hidden="true" /></div>
          <div class="card-info">
            <div class="tag">${username}</div>
            <div class="username">&nbsp;</div>
          </div>
        </div>
        <div class="comment"></div>
        <div class="topic-bar">TOP COMMENT</div>
      `;

      const commentDiv = card.querySelector('.comment');
      commentDiv.textContent = decodeHtmlEntities(comment).trim();

      container.appendChild(card);
    });
  }
}

async function createCustomCard() {
  const username = document.getElementById('customUsername').value || '@Anonymous';
  const comment = document.getElementById('customComment').value || 'No comment provided.';
  const link = document.getElementById('customAvatarLink').value.trim();

  const avatarUrl = await getAvatarFromChannel(link);

  const container = document.getElementById('manualCards');

  const card = document.createElement('div');
  card.className = 'comment-card';
  card.innerHTML = `
    <input type="checkbox" class="export-check">
    <div class="card-header">
      <div class="avatar"><img src="${avatarUrl}" alt="" aria-hidden="true" /></div>
      <div class="card-info">
        <div class="tag">${username}</div>
        <div class="username">&nbsp;</div>
      </div>
    </div>
    <div class="comment"></div>
    <div class="topic-bar">TOP COMMENT</div>
  `;

  const commentDiv = card.querySelector('.comment');
  commentDiv.textContent = comment.trim();

  container.appendChild(card);
}

async function getAvatarFromChannel(link) {
  if (!link) return 'https://i.imgur.com/WaUgaKz.png';

  const apiKey = 'AIzaSyCLmeJmhxPNXVr-5yUVbmnfLV4O-4oRsa4';
  let channelId = '';

  try {
    if (link.includes('/channel/')) {
      channelId = link.split('/channel/')[1].split(/[/?]/)[0];
    } else if (link.includes('@')) {
      const username = link.split('@')[1].split(/[/?]/)[0];
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${apiKey}`);
      const data = await res.json();
      channelId = data?.items?.[0]?.id?.channelId || '';
    }

    if (!channelId) throw new Error('Invalid channel ID');

    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`);
    const json = await response.json();
    return json.items?.[0]?.snippet?.thumbnails?.default?.url || 'https://i.imgur.com/WaUgaKz.png';
  } catch (e) {
    console.warn('Avatar fetch failed, using default.', e);
    return 'https://i.imgur.com/WaUgaKz.png';
  }
}

function exportAllCards() {
  const cards = document.querySelectorAll('.comment-card');
  let count = 1;

  cards.forEach((card) => {
    const isChecked = card.querySelector('.export-check');
    if (isChecked && isChecked.checked) {
      const clone = card.cloneNode(true);
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.display = 'inline-block';
      clone.querySelector('.export-check').remove();

      document.body.appendChild(clone);

      html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `feedback_card_${count++}.png`;
        link.href = canvas.toDataURL();
        link.click();
        clone.remove();
      });
    }
  });
}

function decodeHtmlEntities(str) {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent;
}

function toggleAllCheckboxes(source) {
  const checkboxes = document.querySelectorAll('.export-check');
  checkboxes.forEach(checkbox => {
    checkbox.checked = source.checked;
  });
}
