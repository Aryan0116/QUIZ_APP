
# DECODE CO-A QUIZEE: Data Flow Diagram

## Overview

This document provides a comprehensive overview of the data flow within the DECODE CO-A QUIZEE application, illustrating how information moves between different components and entities in the system.

## Level 0 DFD (Context Diagram)

```
                   +-------------------+
                   |                   |
 +--------+        |                   |        +----------+
 |        |------->|   DECODE CO-A     |------->|          |
 | TEACHER|        |     QUIZEE        |        |  STUDENT |
 |        |<-------|    APPLICATION    |<-------|          |
 +--------+        |                   |        +----------+
                   |                   |
                   +-------------------+
```

## Level 1 DFD (Main Processes)

```
                 +------------+
                 | User       |
                 | Authentication|
                 +------+-----+
                        |
           +-----------+-----------+
           |                       |
  +--------v-------+       +-------v--------+
  |                |       |                |
  | Teacher Module |       | Student Module |
  |                |       |                |
  +--------+-------+       +-------+--------+
           |                       |
           |                       |
+----------v---------+   +---------v----------+
|                    |   |                    |
| Question Management|   |   Quiz Taking      |
|                    |   |                    |
+----------+---------+   +---------+----------+
           |                       |
           |                       |
   +-------v-------+        +------v--------+
   |               |        |               |
   | Quiz Creation |        | Result Viewing|
   |               |        |               |
   +-------+-------+        +------+--------+
           |                       |
           |                       |
     +-----v-----------------------v-----+
     |                                   |
     |           Database                |
     |                                   |
     +-----------------------------------+
```

## Level 2 DFD (Detailed Processes)

### Authentication Flow

```
+----------+      +-------------+     +--------------+      +-------------+
|          |----->|  Validate   |---->| Create/Update|----->|             |
|  User    |      |  Credentials|     |  User Record |      | Application |
|          |<-----|             |<----|              |<-----|   Access    |
+----------+      +-------------+     +--------------+      +-------------+
```

### Teacher Module Flow

```
+----------+     +---------------+     +----------------+     +--------------+
|          |---->| Create/Update |---->| Manage Question|---->|              |
|  Teacher |     |   Questions   |     |     Bank       |     |              |
|          |<----|               |<----|                |<----|              |
+----------+     +---------------+     +----------------+     |              |
     |                                                        |  Database    |
     |           +---------------+     +----------------+     |              |
     |---------->| Create/Update |---->| Assign Quizzes |---->|              |
     |           |   Quizzes     |     |                |     |              |
     |<----------|               |<----|                |<----|              |
     |           +---------------+     +----------------+     |              |
     |                                                        |              |
     |           +---------------+     +----------------+     |              |
     +---------->|  View Student |---->|    Analyze     |---->|              |
                 |    Results    |     |  Performance   |     |              |
                 |               |<----|                |<----|              |
                 +---------------+     +----------------+     +--------------+
```

### Student Module Flow

```
+----------+     +---------------+     +----------------+     +--------------+
|          |---->|  View Active  |---->|  Attempt Quiz  |---->|              |
|  Student |     |    Quizzes    |     |                |     |              |
|          |<----|               |<----|                |<----|              |
+----------+     +---------------+     +----------------+     |  Database    |
     |                                                        |              |
     |           +---------------+     +----------------+     |              |
     +---------->|  View Results |---->|  Submit Feedback|--->|              |
                 |               |     |                |     |              |
                 |               |<----|                |<----|              |
                 +---------------+     +----------------+     +--------------+
```

## Data Stores

1. **Users**: Stores user authentication and profile data
2. **Questions**: Repository of all questions created by teachers
3. **Quizzes**: Configuration of quizzes with selected questions
4. **Student Results**: Records of student quiz attempts and scores

## External Entities

1. **Teachers**: Create and manage questions, quizzes, and view student performance
2. **Students**: Take quizzes and view their results

## Data Flows

1. **Authentication Data**: User credentials and profile information
2. **Question Data**: Question text, options, correct answers, and metadata
3. **Quiz Configuration**: Selected questions, time limits, and scoring rules
4. **Student Responses**: Answers submitted during quiz attempts
5. **Performance Analytics**: Aggregated data on student performance
