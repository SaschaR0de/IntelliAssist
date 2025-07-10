# OpenAI SDK Monitoring & Debugging Guide

## Overview
Your OpenAI service (`server/services/openai.ts`) has comprehensive monitoring and debugging capabilities implemented. This guide explains how to monitor API usage, debug issues, and optimize performance.

## Current Monitoring Setup

### 1. Custom SDK Monitor
- **Tool**: Custom monitoring SDK (`lib/api-sdk`)
- **Client ID**: `0db92d0c-a8e5-47a4-befb-bbb48d2f6c86`
- **Purpose**: Tracks API calls, captures inputs/outputs, and logs errors

### 2. Debug Logging System
- **Function**: `debugLog(operation, data)`
- **Format**: `[timestamp] [OpenAI-operation] {json_data}`
- **Location**: All logs go to console output

## Monitored Operations

### 1. Ticket Analysis (`analyzeTicket`)
**Monitor**: `monitoredTicketAnalysis`
- **Captures**: Input content, analysis results
- **Logs**: 
  - `ANALYZE_TICKET_START` - Request initiation
  - `ANALYZE_TICKET_REQUEST` - API call details
  - `ANALYZE_TICKET_RESPONSE` - API response metrics
  - `ANALYZE_TICKET_SUCCESS` - Final results
  - `ANALYZE_TICKET_ERROR` - Error details

### 2. Document Summarization (`summarizeDocument`)
**Monitor**: `monitoredSummarizeDocument`
- **Captures**: Content + filename, summary results
- **Logs**: Similar pattern to ticket analysis

### 3. Response Drafting (`draftResponse`)
**Monitor**: `monitoredDraftResponse`
- **Captures**: Ticket content, context, template, and draft
- **Logs**: Similar pattern to ticket analysis

### 4. Knowledge Search (`searchKnowledge`)
**Monitor**: `monitoredSearchKnowledge`
- **Captures**: Query, document count, search results
- **Logs**: 
  - `SEARCH_KNOWLEDGE_START` - Query initiation
  - `SEARCH_KNOWLEDGE_FILTERING` - Document filtering results
  - `SEARCH_KNOWLEDGE_NO_RESULTS` - When no matches found
  - `SEARCH_KNOWLEDGE_REQUEST` - API call details
  - `SEARCH_KNOWLEDGE_RESPONSE` - API response metrics
  - `SEARCH_KNOWLEDGE_SUCCESS` - Final results
  - `SEARCH_KNOWLEDGE_ERROR` - Error details

## Key Metrics Being Tracked

### API Usage
- **Model**: Always "gpt-4o"
- **Token Usage**: Input/output tokens per request
- **Cost Tracking**: Via OpenAI usage object
- **Request IDs**: For API debugging

### Performance
- **Response Time**: Full end-to-end duration
- **Content Length**: Input/output size
- **Temperature**: AI creativity setting (0.3-0.4)

### Quality Metrics
- **Success Rate**: Successful vs failed requests
- **Error Types**: API errors, parsing errors, validation errors
- **Content Quality**: Input preprocessing, output validation

## How to Use Debug Logs

### 1. Enable Debug Logging
Debug logs are automatically enabled. To view them:
```bash
# In development (logs appear in console)
npm run dev

# In production (redirect to file)
npm start > openai-debug.log 2>&1
```

### 2. Sample Debug Output
```
[2024-01-10T23:14:17.000Z] [OpenAI-INIT] {
  "hasApiKey": true,
  "apiKeyPrefix": "sk-proj-ab...",
  "model": "gpt-4o",
  "sdkVersion": "4.0"
}

[2024-01-10T23:14:18.000Z] [OpenAI-SEARCH_KNOWLEDGE_START] {
  "query": "API documentation",
  "documentsCount": 1,
  "timestamp": "2024-01-10T23:14:18.000Z"
}

[2024-01-10T23:14:18.000Z] [OpenAI-SEARCH_KNOWLEDGE_FILTERING] {
  "totalDocs": 1,
  "relevantDocs": 1,
  "topScores": [
    {
      "title": "Doc1.pdf",
      "score": 4
    }
  ],
  "filteringTime": 2
}

[2024-01-10T23:14:21.000Z] [OpenAI-SEARCH_KNOWLEDGE_RESPONSE] {
  "id": "chatcmpl-AbC123",
  "model": "gpt-4o",
  "usage": {
    "prompt_tokens": 1250,
    "completion_tokens": 150,
    "total_tokens": 1400
  },
  "finishReason": "stop",
  "responseLength": 500,
  "duration": 2657
}
```

### 3. Monitoring API Key Issues
```bash
# Check if API key is configured
grep "OpenAI-INIT" logs | jq '.hasApiKey'

# Check for API key errors
grep "OpenAI.*ERROR" logs | grep "API key"
```

### 4. Performance Monitoring
```bash
# Check average response times
grep "OpenAI.*RESPONSE" logs | jq '.duration' | awk '{sum+=$1} END {print "Average:", sum/NR, "ms"}'

# Check token usage
grep "OpenAI.*RESPONSE" logs | jq '.usage.total_tokens' | awk '{sum+=$1} END {print "Total tokens:", sum}'
```

## Common Debug Scenarios

### 1. API Key Not Working
**Symptoms**: 
- `ANALYZE_TICKET_ERROR: "OpenAI API key not configured"`
- `hasApiKey: false` in INIT logs

**Solution**:
```bash
# Check environment variables
echo $OPENAI_API_KEY

# Set API key
export OPENAI_API_KEY="sk-proj-your-key-here"
```

### 2. Slow Response Times
**Symptoms**: 
- `duration > 5000ms` in RESPONSE logs
- User complaints about slow AI features

**Debug Steps**:
```bash
# Check recent response times
grep "RESPONSE" logs | tail -10 | jq '.duration'

# Check if it's specific to certain operations
grep "SEARCH_KNOWLEDGE_RESPONSE" logs | jq '.duration' | sort -n
```

### 3. Token Usage Monitoring
**Symptoms**: 
- High API costs
- Rate limiting errors

**Debug Steps**:
```bash
# Daily token usage
grep "$(date +%Y-%m-%d)" logs | grep "RESPONSE" | jq '.usage.total_tokens' | awk '{sum+=$1} END {print sum}'

# Most expensive operations
grep "RESPONSE" logs | jq '{operation: .operation, tokens: .usage.total_tokens}' | sort -k2 -n
```

### 4. Search Quality Issues
**Symptoms**: 
- No search results when documents exist
- Irrelevant search results

**Debug Steps**:
```bash
# Check filtering effectiveness
grep "SEARCH_KNOWLEDGE_FILTERING" logs | jq '{totalDocs, relevantDocs, topScores}'

# Check if documents have content
grep "SEARCH_KNOWLEDGE_NO_RESULTS" logs | jq '{query, totalDocs}'
```

## Recommendations

### 1. Add Log Rotation
```bash
# Add to deployment script
logrotate -f /etc/logrotate.d/openai-debug
```

### 2. Set Up Alerts
```bash
# High error rate alert
grep "ERROR" logs | wc -l > 10 && echo "High error rate detected"

# High token usage alert
daily_tokens=$(grep "$(date +%Y-%m-%d)" logs | grep "RESPONSE" | jq '.usage.total_tokens' | awk '{sum+=$1} END {print sum}')
[ $daily_tokens -gt 100000 ] && echo "High token usage: $daily_tokens"
```

### 3. Performance Optimization
- **Caching**: Cache frequent searches
- **Batch Processing**: Combine multiple document analyses
- **Content Limits**: Trim long documents before sending to API

### 4. Cost Monitoring
- **Daily Reports**: Automated token usage reports
- **Budget Alerts**: Set spending limits
- **Optimization**: Use cheaper models for non-critical operations

## Troubleshooting Commands

```bash
# Check if OpenAI service is working
curl -s "http://localhost:5000/api/search?q=test" | jq '.aiResults | length'

# Monitor real-time logs
tail -f logs/openai-debug.log | grep "OpenAI-"

# Check for recent errors
grep "ERROR" logs/openai-debug.log | tail -5

# Get token usage summary
grep "RESPONSE" logs/openai-debug.log | jq '.usage' | tail -10
```

This comprehensive monitoring setup gives you full visibility into your OpenAI API usage, helping you optimize performance, control costs, and debug issues effectively.