// Helper for DRY spend resource menu event listeners
export function setupSpendResourceMenuListeners({
  html,
  actor,
  resourceField,
  resourceLabelKey,
  noResourceKey,
  spendBtnClass = '.spend-resolve-btn',
  dropdownClass = '.spend-resolve-dropdown',
  menuContainerClass = '.spend-resolve-menu-container',
  submenuClass = '.spend-resolve-submenu',
  submenuListClass = '.spend-resolve-submenu-list',
  optionClass = '.spend-resolve-option',
  getActorName = (html) => html.find('input[name="name"]').val() || 'A hero',
  chatPrefix = '',
  onSpend = null // optional callback after spending
}) {
  // Toggle dropdown
  html.on('click', spendBtnClass, function (ev) {
    ev.preventDefault();
    const menu = $(this).siblings(dropdownClass);
    menu.toggle();
  });

  // Hide menu when clicking outside
  $(document).on('mousedown.spendResourceMenu', function (ev) {
    if (!$(ev.target).closest(menuContainerClass).length) {
      $(dropdownClass).hide();
    }
  });

  // Show/hide submenus on hover
  html.find(submenuClass).hover(
    function () {
      $(this).find(submenuListClass).show();
    },
    function () {
      $(this).find(submenuListClass).hide();
    }
  );

  // Handle option click
  html.on('click', optionClass, async function (ev) {
    ev.preventDefault();
    const option = $(this).data('option');
    if (!option) return;
    $(dropdownClass).hide();

    // Option text for chat
    const optionText = $(this).text().trim();
    const actorName = getActorName(html);
    // Get current resource value
    let currentValue = actor.system;
    for (const part of resourceField.split('.')) {
      if (currentValue == null) break;
      currentValue = currentValue[part];
    }

    // Check if resource is 0
    if (currentValue <= 0) {
      ui.notifications.error(game.i18n.localize(noResourceKey));
      return;
    }

    // Reduce resource by 1
    await actor.update({
      ["system." + resourceField]: currentValue - 1
    });

    // Send to chat
    ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: html.data('actorId') }),
      content: `${chatPrefix}<b>${actorName}</b> spends ${game.i18n.localize(resourceLabelKey)}: <b>${optionText}</b>`
    });

    if (onSpend) await onSpend(optionText, actor, html);
  });
} 