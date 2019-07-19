const removeDeprecatedCards = (metabaseQuestions, metadata, savedQuestionMetadata) => {
  
  const tableIDsInMetabase = [];
  const deprecatedCards = [];
  const nativeQueries = [];
  const filteredMetabaseQuestions = [];

  metadata.tables.forEach(table => {
    tableIDsInMetabase.push(table.id);
  })
  savedQuestionMetadata.tables.forEach(table => {
    tableIDsInMetabase.push(table.id);
  })
  let i = 0;
  metabaseQuestions.forEach(question => {
    
    if (question.dataset_query.type === 'native')
      nativeQueries.push({index: i, id: question.id})
    else if (!tableIDsInMetabase.includes(question.dataset_query.query["source-table"]))
      deprecatedCards.push({index: i, id: question.id})
    else
      filteredMetabaseQuestions.push(question);
    i++;
  })
  return filteredMetabaseQuestions;
}

module.exports = removeDeprecatedCards;