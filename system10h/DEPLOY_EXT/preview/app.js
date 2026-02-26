// Live Preview — Frontend Logic
// SSE streaming + Turnstile + tabs + copy + UI

(function () {
  'use strict';

  // ─── CONFIG ──────────────────────────────────────
  // TODO: Replace with actual Worker URL after deploy
  const API_URL = 'https://live-preview-api.hajlajf-art.workers.dev';

  // ─── DOM REFS ────────────────────────────────────
  const form = document.getElementById('preview-form');
  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const outputSection = document.getElementById('output-section');
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  const outputActions = document.getElementById('output-actions');
  const ctaZone = document.getElementById('cta-zone');
  const stickyCta = document.getElementById('sticky-cta');
  const toast = document.getElementById('toast');

  const productInput = document.getElementById('product');
  const painInput = document.getElementById('pain');
  const productCount = document.getElementById('product-count');
  const painCount = document.getElementById('pain-count');

  const tabs = document.querySelectorAll('.tab-btn');
  const panels = {
    email: document.getElementById('panel-email'),
    price: document.getElementById('panel-price'),
    followup: document.getElementById('panel-followup'),
    markets: document.getElementById('panel-markets'),
  };

  // ─── STATE ───────────────────────────────────────
  let isGenerating = false;
  let activeTab = 'email';
  let generatedContent = { email: '', price: '', followup: '', markets: '' };
  let lastFormData = null;

  // ─── CHARACTER COUNTERS ──────────────────────────
  productInput.addEventListener('input', function () {
    productCount.textContent = this.value.length;
  });

  painInput.addEventListener('input', function () {
    painCount.textContent = this.value.length;
  });

  // ─── TABS ────────────────────────────────────────
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (isGenerating) return;
      switchTab(this.dataset.tab);
    });
  });

  function switchTab(tabName) {
    activeTab = tabName;
    tabs.forEach(function (btn) {
      var isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });
    Object.keys(panels).forEach(function (key) {
      panels[key].classList.toggle('hidden', key !== tabName);
    });
  }

  // ─── FORM SUBMIT ─────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isGenerating) return;
    generate();
  });

  // ─── REGENERATE ──────────────────────────────────
  document.getElementById('regenerate-btn').addEventListener('click', function () {
    if (isGenerating || !lastFormData) return;
    generate();
  });

  // ─── COPY BUTTONS ───────────────────────────────
  document.getElementById('copy-current-btn').addEventListener('click', function () {
    copyToClipboard(generatedContent[activeTab]);
  });

  document.getElementById('copy-all-btn').addEventListener('click', function () {
    var all =
      '=== EMAIL SPRZEDAŻOWY ===\n' + generatedContent.email +
      '\n\n=== OBRONA CENY ===\n' + generatedContent.price +
      '\n\n=== FOLLOW-UP ===\n' + generatedContent.followup +
      '\n\n=== NOWE RYNKI ===\n' + generatedContent.markets;
    copyToClipboard(all);
  });

  function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
      showToast();
    });
  }

  function showToast() {
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 2000);
  }

  // ─── EDIT INPUT BUTTON ───────────────────────────
  var editBtn = document.getElementById('edit-input-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function () {
      document.getElementById('preview-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ─── MAIN GENERATE FUNCTION ──────────────────────
  function generate() {
    var industry = document.getElementById('industry').value;
    var product = productInput.value.trim();
    var pain = painInput.value.trim();
    var website = document.getElementById('website').value;

    // Get Turnstile token
    var turnstileResponse = '';
    var turnstileInput = document.querySelector('[name="cf-turnstile-response"]');
    if (turnstileInput) {
      turnstileResponse = turnstileInput.value;
    }

    lastFormData = {
      industry: industry,
      product: product,
      pain: pain,
      website: website,
      turnstileToken: turnstileResponse,
    };

    // Reset UI
    isGenerating = true;
    generatedContent = { email: '', price: '', followup: '', markets: '' };
    submitBtn.disabled = true;
    submitText.textContent = 'Generuję...';
    outputSection.classList.remove('hidden');
    outputActions.classList.add('hidden');
    ctaZone.classList.add('hidden');
    if (stickyCta) stickyCta.classList.remove('visible');

    // Show skeletons
    Object.keys(panels).forEach(function (key) {
      var content = panels[key].querySelector('.output-content');
      var text = panels[key].querySelector('.output-text');
      content.classList.add('skeleton-active');
      text.classList.add('hidden');
      text.textContent = '';
      text.classList.remove('streaming');
    });

    switchTab('email');
    updateStatus('Analizuję Twój kontekst sprzedażowy...');

    // Scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Call API with SSE
    fetchSSE(lastFormData);
  }

  // ─── SSE STREAMING ──────────────────────────────
  function fetchSSE(data) {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (err) {
            throw new Error(err.error || 'Błąd serwera');
          });
        }

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
        var fullText = '';
        var currentSection = null;

        // Show streaming UI
        updateStatus('Tworzę email sprzedażowy...');

        function processChunk() {
          return reader.read().then(function (result) {
            if (result.done) {
              finishGeneration(fullText);
              return;
            }

            buffer += decoder.decode(result.value, { stream: true });

            // Parse SSE events from buffer
            var lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();

              if (line.startsWith('data: ')) {
                var jsonStr = line.substring(6);
                if (jsonStr === '[DONE]') continue;

                try {
                  var event = JSON.parse(jsonStr);

                  // Extract text delta from Claude SSE format
                  if (event.type === 'content_block_delta' && event.delta && event.delta.text) {
                    var text = event.delta.text;
                    fullText += text;

                    // Detect section changes
                    var newSection = detectSection(fullText);
                    if (newSection !== currentSection) {
                      currentSection = newSection;
                      updateStatusForSection(currentSection);
                      if (currentSection && currentSection !== 'email') {
                        switchTab(currentSection);
                      }
                    }

                    // Render streamed text into appropriate panel
                    renderStreamedText(fullText);
                  }
                } catch (e) {
                  // Skip malformed JSON lines
                }
              }
            }

            return processChunk();
          });
        }

        return processChunk();
      })
      .catch(function (err) {
        handleError(err.message);
      });
  }

  // ─── SECTION DETECTION ──────────────────────────
  function detectSection(text) {
    var emailIdx = text.indexOf('===EMAIL SPRZEDAŻOWY===');
    var priceIdx = text.indexOf('===OBRONA CENY===');
    var followupIdx = text.indexOf('===FOLLOW-UP===');
    var marketsIdx = text.indexOf('===NOWE RYNKI===');

    if (marketsIdx > -1 && text.length > marketsIdx + 20) return 'markets';
    if (followupIdx > -1 && text.length > followupIdx + 20) return 'followup';
    if (priceIdx > -1 && text.length > priceIdx + 20) return 'price';
    if (emailIdx > -1) return 'email';
    return 'email';
  }

  function updateStatusForSection(section) {
    var messages = {
      email: 'Tworzę email sprzedażowy...',
      price: 'Przygotowuję obronę ceny...',
      followup: 'Piszę follow-up...',
      markets: 'Odkrywam nowe segmenty klientów...',
    };
    updateStatus(messages[section] || 'Generuję...');
  }

  // ─── RENDER STREAMED TEXT ────────────────────────
  function renderStreamedText(fullText) {
    var sections = parseSections(fullText);

    Object.keys(sections).forEach(function (key) {
      if (!sections[key]) return;

      var panel = panels[key];
      var content = panel.querySelector('.output-content');
      var textEl = panel.querySelector('.output-text');

      content.classList.remove('skeleton-active');
      textEl.classList.remove('hidden');
      textEl.classList.add('streaming');
      textEl.textContent = sections[key].trim();
    });
  }

  function parseSections(text) {
    var result = { email: '', price: '', followup: '', markets: '' };

    var emailMatch = text.split('===EMAIL SPRZEDAŻOWY===')[1];
    if (emailMatch) {
      var emailEnd = emailMatch.indexOf('===OBRONA CENY===');
      result.email = emailEnd > -1 ? emailMatch.substring(0, emailEnd) : emailMatch;
    }

    var priceMatch = text.split('===OBRONA CENY===')[1];
    if (priceMatch) {
      var priceEnd = priceMatch.indexOf('===FOLLOW-UP===');
      result.price = priceEnd > -1 ? priceMatch.substring(0, priceEnd) : priceMatch;
    }

    var followupMatch = text.split('===FOLLOW-UP===')[1];
    if (followupMatch) {
      var followupEnd = followupMatch.indexOf('===NOWE RYNKI===');
      result.followup = followupEnd > -1 ? followupMatch.substring(0, followupEnd) : followupMatch;
    }

    var marketsMatch = text.split('===NOWE RYNKI===')[1];
    if (marketsMatch) {
      result.markets = marketsMatch;
    }

    return result;
  }

  // ─── FINISH GENERATION ──────────────────────────
  function finishGeneration(fullText) {
    isGenerating = false;
    submitBtn.disabled = false;
    submitText.textContent = 'Generuj moje skrypty — za darmo';

    // Parse final content
    var sections = parseSections(fullText);
    generatedContent = {
      email: (sections.email || '').trim(),
      price: (sections.price || '').trim(),
      followup: (sections.followup || '').trim(),
      markets: (sections.markets || '').trim(),
    };

    // Show "Nowe rynki" footer hint
    var marketsFooter = document.querySelector('.markets-footer');
    if (marketsFooter && generatedContent.markets) {
      marketsFooter.classList.remove('hidden');
    }

    // Remove streaming cursor
    document.querySelectorAll('.output-text').forEach(function (el) {
      el.classList.remove('streaming');
    });

    // Show actions and CTA
    statusBar.classList.add('hidden');
    outputActions.classList.remove('hidden');
    ctaZone.classList.remove('hidden');

    // Show sticky CTA on mobile
    if (stickyCta && window.innerWidth < 640) {
      stickyCta.classList.add('visible');
    }

    // Switch to first tab with content
    switchTab('email');

    // Reset Turnstile for next use
    if (window.turnstile) {
      window.turnstile.reset();
    }
  }

  // ─── ERROR HANDLING ─────────────────────────────
  function handleError(message) {
    isGenerating = false;
    submitBtn.disabled = false;
    submitText.textContent = 'Generuj moje skrypty — za darmo';

    updateStatus('');
    statusBar.innerHTML =
      '<p class="text-red-400 text-sm">' +
      '<i class="fa-solid fa-circle-exclamation mr-1"></i> ' +
      escapeHtml(message) +
      '</p>';

    if (window.turnstile) {
      window.turnstile.reset();
    }
  }

  // ─── HELPERS ────────────────────────────────────
  function updateStatus(msg) {
    statusBar.classList.remove('hidden');
    statusBar.innerHTML =
      '<div class="inline-flex items-center gap-2 text-sm text-brand-400">' +
      '<div class="loading-dots"><span></span><span></span><span></span></div>' +
      '<span>' + escapeHtml(msg) + '</span>' +
      '</div>';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ─── SUBSCRIBE (Email Capture → MailerLite) ────────
  var subscribeForm = document.getElementById('subscribe-form');
  var subscribeBtn = document.getElementById('subscribe-btn');
  var subscribeText = document.getElementById('subscribe-text');
  var emailCapture = document.getElementById('email-capture');
  var emailSuccess = document.getElementById('email-success');
  var sentEmail = document.getElementById('sent-email');

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('sub-name').value.trim();
      var email = document.getElementById('sub-email').value.trim();
      var consent = document.getElementById('sub-consent').checked;

      if (!name || !email || !consent) return;

      subscribeBtn.disabled = true;
      subscribeText.textContent = 'Zapisuję...';

      fetch(API_URL + '/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          industry: lastFormData ? lastFormData.industry : '',
          content: generatedContent,
        }),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Subscribe failed');
          }
          return response.json();
        })
        .then(function () {
          emailCapture.classList.add('hidden');
          emailSuccess.classList.remove('hidden');
          if (sentEmail) sentEmail.textContent = email;
        })
        .catch(function () {
          subscribeBtn.disabled = false;
          subscribeText.textContent = 'Spróbuj ponownie';
          setTimeout(function () {
            subscribeText.textContent = 'Wyślij na email';
          }, 3000);
        });
    });
  }
})();
