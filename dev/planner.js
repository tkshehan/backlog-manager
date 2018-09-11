const packingApi = require('./packing-api');
const {addNewEntry, buildModalListeners, saveAndUpdate} = require('./modals');
let currentList = {};


function loadPlanner(id) {
  buildPage();
  buildListeners(currentList);
  getAndDisplayData(id);
}

function buildPage() {
  $('main').empty();

  const $optionBar = buildOptionBar();
  const $quickItems = buildQuickItems();
  const $tableSection = $('<section>').addClass('table-section');
  const $content = $('<div>').addClass('flex-grid');

  $content.append($quickItems, $tableSection);
  $('main').append($optionBar, $content);

  function buildOptionBar() {
    const $optionBar = $('<section>').addClass('option-bar flex-grid');
    const $newEntryButton = $('<div>')
      .addClass('col js-new-entry-button')
      .append('<button> New Entry');

    const $emptyCol = $('<div>').addClass('col');
    const $mainListButton = $('<div>').addClass('col js-back');
    $mainListButton.append('<button> Back');
    const $saveListButton = $('<div>').addClass('col js-save');
    $saveListButton.append('<button> Save');

    $optionBar.append($newEntryButton, $emptyCol, $mainListButton, $emptyCol.clone(), $saveListButton);
    return $optionBar;
  }

  function buildQuickItems() {
    let $quickItems = $('<section>').addClass('quick-items');
    let items = ['clothes', 'socks', 'food', 'swimsuit', 'phone charger', 'first-aid kit'];
    items.forEach(function(item) {
      let $newButton = $('<button>')
        .text(item)
        .addClass('js-quick-item');
      $quickItems.append($newButton);
    });
    return $quickItems;
  }
}

function getAndDisplayData(id) {
  getData(id)
    .then(data => {
      currentList.id = data.id;
      currentList.items = data.items;
      currentList.name = data.name;
      return currentList;
    })
    .then(displayData)
}

function getData(id) {
  return packingApi.getById(id);
}

function displayData(data) {
  let $table = $('<table>')
    .addClass('js-table items-table')
    .append(
      $('<tr>').append(
        $('<th>'),
        $('<th>').text('Item'),
        $('<th>').text('To Pack'),
        $('<th>')
      )
    );

  data.items.forEach((item) => {
    let $newRow = $('<tr>').data('id', item._id)
      .append(
        $('<td>').addClass('td-check')
          .append(
            $('<button>').text('Check').addClass('js-check-entry')
          ),
        $('<td>').text(item.item),
        $('<td>').text(`${item.packed} / ${item.toPack}`).addClass('td-packed'),
        $('<td>').addClass('td-delete')
          .append(
            $('<button>').text('delete').addClass('js-delete-entry')
          )
      )

    if (item.packed >= item.toPack) {
      $newRow.addClass('green');
    }

    $table.append($newRow);
  });

  $('.table-section').append($table);
}

function buildListeners(list) {
  let $main = $('main');
  $main.off();
  $('body').off();

  buildModalListeners(list);

  $main.on('click', '.js-back', function() {
    const {loadManager} = require('./lists-manager');
    loadManager();
  });

  $main.on('click', '.js-check-entry', function() {
    let $row = $(this).closest('tr');
    let item = currentList.items.filter(item => item._id === $row.data('id'))[0];

    if (item.packed + 1 === item.toPack) {
      item.packed++;
      $row.addClass('green');
    } else if (item.packed < item.toPack) {
      item.packed++;
    } else {
      item.packed = 0;
      $row.removeClass('green');
    }

    $row.children('.td-packed').text(`${item.packed} / ${item.toPack}`);
  })

  $main.on('click', '.js-delete-entry', function() {
    let $row = $(this).closest('tr');
    currentList.items = currentList.items.filter(item => item._id !== $row.data('id'));
    $row.remove();
  });

  $main.on('click', '.js-save', function() {
    packingApi.updatedById(currentList.id, currentList);
  });

  $('main').on('click', '.js-quick-item', function() {
    const newItem = $(this).text();
    let hasItem = false;

    currentList.items.forEach(item => {
      if (item.item === newItem) {
        item.toPack++;
        hasItem = true;
      }
    });

    if (!hasItem) {
      addNewEntry(currentList, newItem);
    }

    saveAndUpdate(currentList);
  })

}

module.exports = {loadPlanner};