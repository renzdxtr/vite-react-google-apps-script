function getSpecificFormChoices() {
  const formUrl = 'https://docs.google.com/forms/d/17q9JnctOR51-TCxFvL_k07wqiu1IJTyZlY-QOTzuRv0/edit'; // 🔁 Replace with your Form URL
  const targetQuestions = ["Crop", "Seed Class", "Location", "Program"];

  try {
    const form = FormApp.openByUrl(formUrl);
    const items = form.getItems();
    const choicesMap = {};

    items.forEach(item => {
      const title = item.getTitle().trim();
      const type = item.getType();

      if (!targetQuestions.includes(title)) return;

      let question = null;
      if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
        question = item.asMultipleChoiceItem();
      } else if (type === FormApp.ItemType.LIST) {
        question = item.asListItem();
      }

      if (question) {
        const choices = question.getChoices().map(choice => choice.getValue());
        choicesMap[title] = choices;
      }
    });

    Logger.log(JSON.stringify(choicesMap, null, 2));
    return choicesMap;
  } catch (error) {
    Logger.log(`Error accessing form: ${error.message}`);
    throw error;
  }
}
