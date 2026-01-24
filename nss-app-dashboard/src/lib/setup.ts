import { supabase } from './supabase'

export async function setupDefaultRoles() {
  try {
    const { data: existingRoles, error: fetchError } = await supabase
      .from('role_definitions')
      .select('role_name')

    if (fetchError) {
      console.error('Error checking existing roles:', fetchError)
      return
    }

    const existingRoleNames = existingRoles?.map(r => r.role_name) || []

    const defaultRoles = [
      {
        role_name: 'admin',
        display_name: 'Administrator',
        description: 'Full system access and management',
        permissions: {
          all: true,
          events: { create: true, read: true, update: true, delete: true },
          volunteers: { create: true, read: true, update: true, delete: true },
          users: { create: true, read: true, update: true, delete: true },
          reports: { read: true }
        },
        hierarchy_level: 0
      },
      {
        role_name: 'program_officer',
        display_name: 'Program Officer',
        description: 'Program management and oversight',
        permissions: {
          events: { create: true, read: true, update: true, delete: false },
          volunteers: { create: true, read: true, update: true, delete: false },
          reports: { read: true }
        },
        hierarchy_level: 1
      },
      {
        role_name: 'event_lead',
        display_name: 'Event Lead',
        description: 'Event management and participation tracking',
        permissions: {
          events: { create: true, read: true, update: true, delete: false },
          volunteers: { read: true, update: false },
          attendance: { create: true, read: true, update: true }
        },
        hierarchy_level: 2
      },
      {
        role_name: 'documentation_lead',
        display_name: 'Documentation Lead',
        description: 'Volunteer management and record keeping',
        permissions: {
          volunteers: { create: true, read: true, update: true, delete: false },
          events: { read: true }
        },
        hierarchy_level: 3
      },
      {
        role_name: 'viewer',
        display_name: 'Viewer',
        description: 'Read-only access for reporting',
        permissions: {
          volunteers: { read: true },
          events: { read: true },
          reports: { read: true }
        },
        hierarchy_level: 4
      }
    ]

    const rolesToInsert = defaultRoles.filter(
      role => !existingRoleNames.includes(role.role_name)
    )

    if (rolesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('role_definitions')
        .insert(rolesToInsert)

      if (insertError) {
        console.error('Error inserting default roles:', insertError)
        return
      }

      console.log(`Inserted ${rolesToInsert.length} default roles`)
    } else {
      console.log('All default roles already exist')
    }
  } catch (error) {
    console.error('Error setting up default roles:', error)
  }
}

export async function setupEventCategories() {
  try {
    const { data: existingCategories, error: fetchError } = await supabase
      .from('event_categories')
      .select('category_name')

    if (fetchError) {
      console.error('Error checking existing categories:', fetchError)
      return
    }

    const existingCategoryNames = existingCategories?.map(c => c.category_name) || []

    const defaultCategories = [
      {
        category_name: 'area_based_1',
        display_name: 'Area Based - 1',
        description: 'Community development activities',
        color_hex: '#3B82F6'
      },
      {
        category_name: 'area_based_2',
        display_name: 'Area Based - 2',
        description: 'Environmental and sustainability activities',
        color_hex: '#10B981'
      },
      {
        category_name: 'college_event',
        display_name: 'College Event',
        description: 'Campus-based NSS activities',
        color_hex: '#8B5CF6'
      },
      {
        category_name: 'camp',
        display_name: 'Camp',
        description: 'Multi-day camps and special programs',
        color_hex: '#F59E0B'
      },
      {
        category_name: 'workshop',
        display_name: 'Workshop',
        description: 'Educational workshops and training',
        color_hex: '#EF4444'
      },
      {
        category_name: 'rally',
        display_name: 'Rally',
        description: 'Awareness rallies and public events',
        color_hex: '#06B6D4'
      }
    ]

    const categoriesToInsert = defaultCategories.filter(
      category => !existingCategoryNames.includes(category.category_name)
    )

    if (categoriesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('event_categories')
        .insert(categoriesToInsert)

      if (insertError) {
        console.error('Error inserting default categories:', insertError)
        return
      }

      console.log(`Inserted ${categoriesToInsert.length} default categories`)
    } else {
      console.log('All default categories already exist')
    }
  } catch (error) {
    console.error('Error setting up event categories:', error)
  }
}

export async function initializeDatabase() {
  console.log('Initializing database with default data...')
  await setupDefaultRoles()
  await setupEventCategories()
  console.log('Database initialization complete')
}