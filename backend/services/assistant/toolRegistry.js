/**
 * ToolRegistry — Comprehensive Function Definitions for Ollama Local Agent
 * 
 * Strict JSON Schema definitions for all application control operations across:
 * - Tasks, Goals & Folders, Milestones & Modules, Habits, Focus, Reminders, Memory, and Analytics.
 */

export const assistantTools = [
  // =========================================================================
  // 1. TASK MANAGEMENT TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task with title, schedule, priority, and optional goal linkage.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Clear title of the task to be completed' },
          description: { type: 'string', description: 'Additional context or instructions' },
          dueDate: { type: 'string', description: 'Scheduled date (YYYY-MM-DD or ISO string)' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Urgency priority level' },
          taskType: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'], description: 'Cadence timeframe' },
          estimatedMinutes: { type: 'number', description: 'Estimated time in minutes (e.g. 45)' },
          reminderMinutesBefore: { type: 'number', description: 'Schedule an alert N minutes before due time' },
          goalId: { type: 'string', description: 'Optional linked goal ID' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_multiple_tasks',
      description: 'Create multiple tasks in a single batch operation.',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string' },
                dueDate: { type: 'string', description: 'YYYY-MM-DD' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                estimatedMinutes: { type: 'number' },
                goalId: { type: 'string' }
              },
              required: ['title']
            },
            description: 'List of task items to create'
          }
        },
        required: ['tasks']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_tasks',
      description: 'Search for tasks matching a query or keyword.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords in task title or description' },
          status: { type: 'string', enum: ['all', 'pending', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_task',
      description: 'Retrieve details of a single task by ID or title.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID' },
          taskTitle: { type: 'string', description: 'Task title' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_today_tasks',
      description: 'Retrieve all tasks scheduled for today with completion status.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Optional YYYY-MM-DD date, defaults to today' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_tasks',
      description: 'Get all incomplete/pending tasks across the workspace.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum tasks to return (default 10)' },
          goalId: { type: 'string', description: 'Optional filter by goal' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_completed_tasks',
      description: 'Get recently completed tasks.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum tasks to return (default 10)' },
          date: { type: 'string', description: 'Filter by completion date (YYYY-MM-DD)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_tasks',
      description: 'Get all overdue incomplete tasks that missed their scheduled deadline.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update properties (priority, date, title, description, time) of an existing task.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID' },
          taskTitle: { type: 'string', description: 'Task title to match' },
          title: { type: 'string', description: 'New task title' },
          description: { type: 'string', description: 'New description' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          dueDate: { type: 'string', description: 'New due date (YYYY-MM-DD)' },
          estimatedMinutes: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as completed by exact title or task ID.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Unique task ID' },
          taskTitle: { type: 'string', description: 'Title or partial title of the task to complete' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reopen_task',
      description: 'Reopen a previously completed task back to pending.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID' },
          taskTitle: { type: 'string', description: 'Task title' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_task',
      description: 'Reschedule an existing task to a new date or time.',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: { type: 'string', description: 'Task title to reschedule' },
          taskId: { type: 'string', description: 'Task ID' },
          newDueDate: { type: 'string', description: 'New date (YYYY-MM-DD or tomorrow, next monday)' }
        },
        required: ['newDueDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'skip_task',
      description: 'Skip or cancel a task for today.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          taskTitle: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'archive_task',
      description: 'Archive a task without permanently removing it.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          taskTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'restore_task',
      description: 'Restore an archived task back to active pending.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          taskTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Safely delete a task. Defaults to soft removal; permanent delete requires confirmation.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID' },
          taskTitle: { type: 'string', description: 'Task title' },
          permanent: { type: 'boolean', description: 'Set true only if permanently removing record' },
          confirmationToken: { type: 'string', description: 'Security confirmation token for permanent deletion' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_update_tasks',
      description: 'Bulk complete, reschedule, archive, or delete multiple tasks (e.g. move unfinished tasks to tomorrow).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['complete', 'reschedule', 'archive', 'delete'], description: 'Action to perform' },
          filter: { type: 'string', enum: ['today_unfinished', 'overdue', 'completed_last_week', 'all_pending'], description: 'Predefined filter' },
          newDueDate: { type: 'string', description: 'New date if rescheduling (YYYY-MM-DD)' },
          taskIds: { type: 'array', items: { type: 'string' }, description: 'Optional explicit task IDs' },
          confirmationToken: { type: 'string', description: 'Required for bulk deletion' }
        },
        required: ['action']
      }
    }
  },

  // =========================================================================
  // 2. GOAL & FOLDER MANAGEMENT TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_goal',
      description: 'Create a long-term goal with milestones and module roadmap.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the goal' },
          category: {
            type: 'string',
            enum: ['DSA & Coding', 'System Design', 'Web Development', 'Academic Coursework', 'Research / Minor Project', 'Competitive Exam', 'Other'],
            description: 'Goal category'
          },
          targetDate: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
          startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          moduleCount: { type: 'number', description: 'Total planned modules (default 10)' },
          targetQuantity: { type: 'number', description: 'Target numerical quantity (e.g. 100 problems)' },
          measurementUnit: { type: 'string', description: 'Measurement unit: Problems, Modules, Chapters, Hours' },
          folderName: { type: 'string', description: 'Folder name to place goal in' },
          folderId: { type: 'string', description: 'Folder ID' },
          description: { type: 'string', description: 'Goal description and objectives' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_goals',
      description: 'Search goals by keywords, category, or status.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords' },
          category: { type: 'string' },
          status: { type: 'string', enum: ['active', 'completed', 'archived', 'all'] }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_goal',
      description: 'Get full details of a specific goal including progress, milestones, and folder.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          goalTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_all_goals',
      description: 'Retrieve all goals across folders with progress percentages and pacing statuses.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'completed', 'archived', 'all'] },
          folderId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_goals',
      description: 'Get active and completed goals with current progress percentages.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'completed', 'all'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_goal_progress',
      description: 'Retrieve detailed progress, pacing, and milestone status for a goal.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string', description: 'Title of the goal' },
          goalId: { type: 'string', description: 'Goal ID' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_goal',
      description: 'Update goal details such as title, targetDate, description, category, or priority.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          goalTitle: { type: 'string' },
          title: { type: 'string', description: 'New title' },
          targetDate: { type: 'string', description: 'New target date (YYYY-MM-DD)' },
          description: { type: 'string' },
          category: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'archive_goal',
      description: 'Archive a goal cleanly.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          goalTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'restore_goal',
      description: 'Restore an archived goal back to active.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          goalTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_goal',
      description: 'Delete a goal. Requires explicit confirmation token if confirmed.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          goalTitle: { type: 'string' },
          confirmationToken: { type: 'string', description: 'Token provided during confirmation prompt' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'move_goal',
      description: 'Move a goal into a folder or subfolder.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          goalTitle: { type: 'string' },
          targetFolderName: { type: 'string', description: 'Name of the destination folder' },
          targetFolderId: { type: 'string', description: 'ID of the destination folder' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_primary_goal',
      description: 'Mark a goal as primary/favorite.',
      parameters: {
        type: 'object',
        properties: {
          goalId: { type: 'string' },
          goalTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_folder',
      description: 'Create a new folder or nested subfolder in the Goals workspace.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Folder name' },
          parentFolderName: { type: 'string', description: 'Parent folder name for subfolders' },
          parentFolderId: { type: 'string', description: 'Parent folder ID' },
          description: { type: 'string' },
          color: { type: 'string' },
          icon: { type: 'string' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rename_folder',
      description: 'Rename an existing goal folder.',
      parameters: {
        type: 'object',
        properties: {
          currentName: { type: 'string' },
          folderId: { type: 'string' },
          newName: { type: 'string' }
        },
        required: ['newName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'move_folder',
      description: 'Move a folder under a new parent folder.',
      parameters: {
        type: 'object',
        properties: {
          folderId: { type: 'string' },
          folderName: { type: 'string' },
          targetParentFolderId: { type: 'string' },
          targetParentFolderName: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_folder',
      description: 'Delete a folder safely. Preserves all contained goals by moving them to the root folder.',
      parameters: {
        type: 'object',
        properties: {
          folderId: { type: 'string' },
          folderName: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_goal_progress',
      description: 'Record numerical progress (e.g. solved 10 problems) toward a goal.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          goalId: { type: 'string' },
          quantityAdded: { type: 'number', description: 'Number of units completed' },
          notes: { type: 'string' }
        },
        required: ['quantityAdded']
      }
    }
  },

  // =========================================================================
  // 3. MILESTONE & MODULE MANAGEMENT TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_milestone',
      description: 'Add a new milestone container to a goal.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string', description: 'Title of the target goal' },
          goalId: { type: 'string', description: 'Goal ID' },
          title: { type: 'string', description: 'Milestone title (e.g. Arrays & Sliding Window)' },
          description: { type: 'string' },
          weight: { type: 'number', description: 'Weight factor (default 1.0)' },
          moduleCount: { type: 'number', description: 'Number of slots to generate' },
          moduleNames: { type: 'array', items: { type: 'string' }, description: 'Optional list of initial module titles' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_milestone',
      description: 'Add a milestone checkpoint to a goal (alias for create_milestone).',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          goalId: { type: 'string' },
          title: { type: 'string' },
          moduleCount: { type: 'number' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_milestones',
      description: 'Search milestones under a goal.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          goalId: { type: 'string' },
          query: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_milestone',
      description: 'Update milestone title, description, weight, or dates.',
      parameters: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' },
          milestoneTitle: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          weight: { type: 'number' },
          targetDate: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_milestone',
      description: 'Delete a milestone and its modules. Requires confirmation.',
      parameters: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' },
          milestoneTitle: { type: 'string' },
          confirmationToken: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_milestone_progress',
      description: 'Get progress percentage, completed modules count, and remaining modules for a milestone.',
      parameters: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' },
          milestoneTitle: { type: 'string' },
          goalId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_module',
      description: 'Add a single module to a milestone.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          goalId: { type: 'string' },
          milestoneTitle: { type: 'string' },
          milestoneId: { type: 'string' },
          title: { type: 'string', description: 'Module title (e.g. Binary Search on Answer Space)' },
          description: { type: 'string' },
          estimatedMinutes: { type: 'number' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_module_slots',
      description: 'Create exactly N sequential module slots (e.g. 30 modules) inside a milestone.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          goalId: { type: 'string' },
          milestoneTitle: { type: 'string' },
          milestoneId: { type: 'string' },
          count: { type: 'number', description: 'Exact number of module records to create (e.g. 30)' }
        },
        required: ['count']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_modules',
      description: 'Generate structured learning modules for a goal.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          goalId: { type: 'string' },
          count: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'populate_module_slots',
      description: 'Populate existing module slots with specific topic names instead of creating duplicates.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          goalId: { type: 'string' },
          milestoneTitle: { type: 'string' },
          milestoneId: { type: 'string' },
          moduleNames: { type: 'array', items: { type: 'string' }, description: 'List of module titles' }
        },
        required: ['moduleNames']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_modules',
      description: 'Search for modules across goals and milestones.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword' },
          goalTitle: { type: 'string' },
          milestoneTitle: { type: 'string' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rename_module',
      description: 'Rename an existing module (e.g. name the first module "Two Sum").',
      parameters: {
        type: 'object',
        properties: {
          milestoneTitle: { type: 'string' },
          milestoneId: { type: 'string' },
          moduleOrder: { type: 'number', description: 'Sequence number of the module (e.g. 1)' },
          moduleId: { type: 'string' },
          newTitle: { type: 'string', description: 'New module title' }
        },
        required: ['newTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'complete_module',
      description: 'Mark an individual module complete by title or order (e.g. complete module 5).',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          milestoneTitle: { type: 'string' },
          moduleTitle: { type: 'string', description: 'Module title or sequence number' },
          moduleOrder: { type: 'number', description: 'Module order number (e.g. 5)' },
          moduleId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reopen_module',
      description: 'Mark a completed module back to incomplete.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          milestoneTitle: { type: 'string' },
          moduleTitle: { type: 'string' },
          moduleOrder: { type: 'number' },
          moduleId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_module',
      description: 'Delete a module record under a milestone.',
      parameters: {
        type: 'object',
        properties: {
          moduleId: { type: 'string' },
          moduleOrder: { type: 'number' },
          milestoneTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reorder_modules',
      description: 'Reorder modules under a milestone.',
      parameters: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' },
          orderedModuleIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['milestoneId', 'orderedModuleIds']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_complete_modules',
      description: 'Complete a range of modules (e.g. modules 1 to 5 in Arrays).',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          milestoneTitle: { type: 'string' },
          fromOrder: { type: 'number', description: 'Start sequence number (e.g. 1)' },
          toOrder: { type: 'number', description: 'End sequence number (e.g. 5)' },
          count: { type: 'number', description: 'Count of next modules to complete' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_next_module',
      description: 'Identify the next incomplete module to study.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          milestoneTitle: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_remaining_modules',
      description: 'List remaining incomplete modules for a milestone or goal.',
      parameters: {
        type: 'object',
        properties: {
          goalTitle: { type: 'string' },
          milestoneTitle: { type: 'string' }
        }
      }
    }
  },

  // =========================================================================
  // 4. HABIT MANAGEMENT TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_habit',
      description: 'Create a new recurring daily or weekly habit.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Name of the habit (e.g. Read 20 pages)' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['DSA & Coding', 'Technical Reading', 'Course Study', 'Physical Exercise', 'Review & Reflection', 'Other']
          },
          frequency: { type: 'string', enum: ['daily', 'weekdays', 'weekends', 'weekly', 'custom'] },
          targetDaysPerWeek: { type: 'number', description: 'Target active days per week (1-7)' },
          timeOfDay: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'anytime'] },
          targetQuantity: { type: 'number', description: 'e.g. 20' },
          measurementUnit: { type: 'string', description: 'e.g. pages, minutes, km' },
          reminderTime: { type: 'string', description: 'e.g. 07:00' },
          goalId: { type: 'string' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_habits',
      description: 'Search habits by keyword.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keyword to search' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_habits',
      description: 'Retrieve all habits with current streaks and frequencies.',
      parameters: {
        type: 'object',
        properties: {
          activeOnly: { type: 'boolean', description: 'Default true' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_today_habits',
      description: 'Get today\'s habit checklist with completion check-in statuses.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date (YYYY-MM-DD)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_habit',
      description: 'Update habit settings (title, target quantity, frequency, timeOfDay).',
      parameters: {
        type: 'object',
        properties: {
          habitId: { type: 'string' },
          habitTitle: { type: 'string' },
          title: { type: 'string' },
          targetQuantity: { type: 'number' },
          frequency: { type: 'string' },
          timeOfDay: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_habit_checkin',
      description: 'Record today\'s completion of an existing habit (or past date) without duplicating the habit definition.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string', description: 'Habit name (e.g. reading, exercise)' },
          habitId: { type: 'string' },
          date: { type: 'string', description: 'Check-in date (YYYY-MM-DD, defaults to today)' },
          notes: { type: 'string' },
          quantity: { type: 'number', description: 'Actual quantity done' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_habit',
      description: 'Log habit completion for today (alias for log_habit_checkin).',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          date: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'undo_habit_checkin',
      description: 'Undo/remove today\'s completion record for a habit.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          habitId: { type: 'string' },
          date: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'pause_habit',
      description: 'Pause a habit temporarily.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          habitId: { type: 'string' },
          days: { type: 'number', description: 'Number of days to pause' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resume_habit',
      description: 'Resume a paused habit back to active.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          habitId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'archive_habit',
      description: 'Archive a habit safely.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          habitId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'restore_habit',
      description: 'Restore an archived habit.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          habitId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_habit',
      description: 'Delete a habit. Permanent delete requires confirmation.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          habitId: { type: 'string' },
          permanent: { type: 'boolean' },
          confirmationToken: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_habit_history',
      description: 'Get historical completion data and streak metrics for a habit.',
      parameters: {
        type: 'object',
        properties: {
          habitTitle: { type: 'string' },
          habitId: { type: 'string' },
          days: { type: 'number', description: 'Number of past days (default 30)' }
        }
      }
    }
  },

  // =========================================================================
  // 5. FOCUS & WORK LOGGING TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'start_focus_session',
      description: 'Start a focused work session or timer.',
      parameters: {
        type: 'object',
        properties: {
          durationMinutes: { type: 'number', description: 'Target session duration (default 25)' },
          sessionType: { type: 'string', enum: ['pomodoro', 'short_break', 'long_break', 'free_flow'] },
          subject: { type: 'string', description: 'Subject or task being worked on' },
          goalId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'pause_focus_session',
      description: 'Pause the current active focus session.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resume_focus_session',
      description: 'Resume the paused focus session.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'finish_focus_session',
      description: 'Finish and record the current focus session.',
      parameters: {
        type: 'object',
        properties: {
          notes: { type: 'string' },
          completionStatus: { type: 'string', enum: ['completed', 'abandoned'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_work_session',
      description: 'Manually record past working hours (e.g. studied for 90 minutes).',
      parameters: {
        type: 'object',
        properties: {
          durationMinutes: { type: 'number', description: 'Duration in minutes' },
          subject: { type: 'string', description: 'Subject or activity studied' },
          goalTitle: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['durationMinutes']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_working_hours',
      description: 'Retrieve logged working and focus hours for today or a specific date.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD (defaults to today)' }
        }
      }
    }
  },

  // =========================================================================
  // 6. REMINDER TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'create_reminder',
      description: 'Set a natural reminder at a specific time or offset.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Reminder text' },
          scheduledAt: { type: 'string', description: 'Date and time (ISO or YYYY-MM-DD HH:MM)' },
          minutesFromNow: { type: 'number', description: 'Offset in minutes from current time' }
        },
        required: ['message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'snooze_reminder',
      description: 'Snooze an existing reminder.',
      parameters: {
        type: 'object',
        properties: {
          reminderId: { type: 'string' },
          snoozeMinutes: { type: 'number', description: 'Minutes to snooze (default 15)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_reminder',
      description: 'Reschedule a reminder to a new time.',
      parameters: {
        type: 'object',
        properties: {
          reminderId: { type: 'string' },
          newScheduledAt: { type: 'string' }
        },
        required: ['newScheduledAt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_reminder',
      description: 'Cancel or dismiss an active reminder.',
      parameters: {
        type: 'object',
        properties: {
          reminderId: { type: 'string' }
        }
      }
    }
  },

  // =========================================================================
  // 7. MEMORY & NOTES TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Save user preferences, habits, facts, or instructions to persistent memory.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Fact or preference to remember' },
          category: {
            type: 'string',
            enum: ['preference', 'routine', 'constraint', 'goal_note', 'feedback', 'general']
          },
          importance: { type: 'number', description: 'Importance rating 1-5' }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_memory',
      description: 'Search stored memories and preferences.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_memory',
      description: 'Update a stored memory.',
      parameters: {
        type: 'object',
        properties: {
          memoryId: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_memory',
      description: 'Remove a piece of saved personal memory.',
      parameters: {
        type: 'object',
        properties: {
          memoryId: { type: 'string' },
          query: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_daily_note',
      description: 'Save a daily reflection or journal entry.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          date: { type: 'string' }
        },
        required: ['content']
      }
    }
  },

  // =========================================================================
  // 8. ANALYTICS, RECALL & UNDO TOOLS
  // =========================================================================
  {
    type: 'function',
    function: {
      name: 'get_daily_summary',
      description: 'Get factual summary of tasks, habits, and hours completed today.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weekly_summary',
      description: 'Get comprehensive summary of weekly consistency and milestones.',
      parameters: {
        type: 'object',
        properties: {
          weekOffset: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_summary',
      description: 'Retrieve monthly progress report across all workspaces.',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'number' },
          month: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_productivity_insights',
      description: 'Get AI productivity insights and consistency score evaluation.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_forgotten_items',
      description: 'Retrieve missed tasks, uncompleted daily habits, and past commitments.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'undo_last_action',
      description: 'Undo the most recent application action (e.g. undo completed task, undo habit checkin, undo module completion).',
      parameters: {
        type: 'object',
        properties: {
          executionId: { type: 'string', description: 'Optional specific action execution ID' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'confirm_pending_action',
      description: 'Confirm and execute a high-risk pending action (e.g. permanent deletion, bulk delete) using its token.',
      parameters: {
        type: 'object',
        properties: {
          confirmationToken: { type: 'string', description: 'The confirmation token issued by the system' }
        },
        required: ['confirmationToken']
      }
    }
  }
];

/**
 * Domain-Aware Tool Slicing for Qwen3.5:4B
 * Slices available tools based on user prompt keywords, optimizing context tokens while
 * ensuring all relevant tools for compound requests are provided.
 */
export const getRelevantTools = (query = '') => {
  if (!query || typeof query !== 'string') {
    return assistantTools;
  }
  const q = query.toLowerCase();

  const isTask = /task|todo|do|finish|complete|schedule|reschedule|overdue|pending|deadline|urgent|kaam|padhna|assignment/i.test(q);
  const isGoal = /goal|target|folder|move|primary|favorite|lakshya/i.test(q);
  const isMilestoneModule = /milestone|module|slot|curriculum|syllabus|chapter|arrays|two sum|dp|binary search|dsa/i.test(q);
  const isHabit = /habit|routine|daily|streak|aadat|drink|exercise|read|check in|checkin|streak/i.test(q);
  const isFocus = /focus|timer|pomodoro|stopwatch|deep work|session|hour|minute/i.test(q);
  const isReminder = /remind|reminder|alert|alarm|yaad|notify/i.test(q);
  const isMemory = /remember|memory|recall|preference|yaad rakhna|note/i.test(q);
  const isAnalytics = /summary|report|insight|analysis|done today|forget|performance|what have i|missed/i.test(q);
  const isUndoOrConfirm = /undo|revert|confirm|yes|proceed|cancel|haan/i.test(q);

  // Always keep essential core tools in the active toolset
  const selectedNames = new Set([
    'create_task',
    'get_today_tasks',
    'complete_task',
    'create_habit',
    'log_habit_checkin',
    'create_reminder',
    'save_memory',
    'get_daily_summary',
    'get_forgotten_items',
    'undo_last_action',
    'confirm_pending_action'
  ]);

  if (isTask) {
    [
      'create_task', 'create_multiple_tasks', 'get_today_tasks', 'search_tasks', 'get_task',
      'complete_task', 'reopen_task', 'reschedule_task', 'skip_task', 'archive_task',
      'restore_task', 'delete_task', 'bulk_update_tasks', 'get_pending_tasks',
      'get_completed_tasks', 'get_overdue_tasks'
    ].forEach(t => selectedNames.add(t));
  }

  if (isGoal) {
    [
      'create_goal', 'search_goals', 'get_goal', 'get_all_goals', 'get_goals',
      'get_goal_progress', 'update_goal', 'archive_goal', 'restore_goal', 'delete_goal',
      'move_goal', 'set_primary_goal', 'create_folder', 'rename_folder', 'move_folder',
      'delete_folder', 'log_goal_progress'
    ].forEach(t => selectedNames.add(t));
  }

  if (isMilestoneModule) {
    [
      'create_milestone', 'add_milestone', 'search_milestones', 'update_milestone',
      'delete_milestone', 'get_milestone_progress', 'add_module', 'generate_module_slots',
      'generate_modules', 'populate_module_slots', 'search_modules', 'rename_module',
      'complete_module', 'reopen_module', 'delete_module', 'reorder_modules',
      'bulk_complete_modules', 'get_next_module', 'get_remaining_modules'
    ].forEach(t => selectedNames.add(t));
  }

  if (isHabit) {
    [
      'create_habit', 'search_habits', 'get_habits', 'get_today_habits', 'update_habit',
      'log_habit_checkin', 'log_habit', 'undo_habit_checkin', 'pause_habit', 'resume_habit',
      'archive_habit', 'restore_habit', 'delete_habit', 'get_habit_history'
    ].forEach(t => selectedNames.add(t));
  }

  if (isFocus) {
    [
      'start_focus_session', 'finish_focus_session', 'pause_focus_session',
      'resume_focus_session', 'log_work_session', 'get_working_hours'
    ].forEach(t => selectedNames.add(t));
  }

  if (isReminder) {
    [
      'create_reminder', 'snooze_reminder', 'reschedule_reminder', 'cancel_reminder'
    ].forEach(t => selectedNames.add(t));
  }

  if (isMemory) {
    [
      'save_memory', 'search_memory', 'update_memory', 'delete_memory', 'save_daily_note'
    ].forEach(t => selectedNames.add(t));
  }

  if (isAnalytics) {
    [
      'get_daily_summary', 'get_weekly_summary', 'get_monthly_summary',
      'get_productivity_insights', 'get_forgotten_items'
    ].forEach(t => selectedNames.add(t));
  }

  const filtered = assistantTools.filter(t => selectedNames.has(t.function.name));
  return filtered.length > 0 ? filtered : assistantTools;
};

export default assistantTools;
