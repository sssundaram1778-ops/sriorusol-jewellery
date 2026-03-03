import { neon } from '@neondatabase/serverless'

// Server-side database connection
const getDatabaseUrl = () => {
  return process.env.VITE_DATABASE_URL || process.env.DATABASE_URL
}

let sql = null
try {
  const dbUrl = getDatabaseUrl()
  if (dbUrl) {
    sql = neon(dbUrl)
  }
} catch (e) {
  console.error('Failed to initialize database:', e.message)
}

export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Check if database is available
  if (!sql) {
    return res.status(500).json({ error: 'Database not configured' })
  }

  try {
    const { action, data } = req.body || {}
    
    switch (action) {
      // Health check
      case 'check':
        await sql`SELECT 1`
        return res.json({ connected: true })

      // Raw SQL execution (for sql proxy from client)
      case 'rawSql':
        if (!data.query) {
          return res.status(400).json({ error: 'Query required' })
        }
        // Execute parameterized query
        const rawResult = await sql.unsafe(data.query, data.params || [])
        return res.json({ data: rawResult })

      // ============ PLEDGES ============
      case 'getPledges':
        const pledges = await sql`
          SELECT * FROM pledges 
          ORDER BY created_at DESC
        `
        return res.json({ data: pledges })

      case 'getPledge':
        const [pledge] = await sql`
          SELECT * FROM pledges WHERE id = ${data.id}
        `
        return res.json({ data: pledge })

      case 'createPledge':
        const [newPledge] = await sql`
          INSERT INTO pledges (
            id, customer_name, customer_phone, customer_address,
            jewel_type, items, total_weight, principal_amount,
            interest_rate, pledge_date, status, notes,
            parent_pledge_id, is_return_pledge, created_at, updated_at
          ) VALUES (
            ${data.id}, ${data.customer_name}, ${data.customer_phone}, ${data.customer_address},
            ${data.jewel_type}, ${data.items}, ${data.total_weight}, ${data.principal_amount},
            ${data.interest_rate}, ${data.pledge_date}, ${data.status || 'active'}, ${data.notes},
            ${data.parent_pledge_id || null}, ${data.is_return_pledge || false}, NOW(), NOW()
          ) RETURNING *
        `
        return res.json({ data: newPledge })

      case 'updatePledge':
        const [updatedPledge] = await sql`
          UPDATE pledges SET
            customer_name = COALESCE(${data.customer_name}, customer_name),
            customer_phone = COALESCE(${data.customer_phone}, customer_phone),
            customer_address = COALESCE(${data.customer_address}, customer_address),
            jewel_type = COALESCE(${data.jewel_type}, jewel_type),
            items = COALESCE(${data.items}, items),
            total_weight = COALESCE(${data.total_weight}, total_weight),
            principal_amount = COALESCE(${data.principal_amount}, principal_amount),
            interest_rate = COALESCE(${data.interest_rate}, interest_rate),
            status = COALESCE(${data.status}, status),
            notes = COALESCE(${data.notes}, notes),
            closed_date = ${data.closed_date || null},
            updated_at = NOW()
          WHERE id = ${data.id}
          RETURNING *
        `
        return res.json({ data: updatedPledge })

      case 'deletePledge':
        await sql`DELETE FROM pledges WHERE id = ${data.id}`
        return res.json({ success: true })

      // ============ FINANCERS ============
      case 'getFinancers':
        const financers = await sql`
          SELECT DISTINCT financer_name FROM pledge_amounts
          WHERE financer_name IS NOT NULL
          ORDER BY financer_name
        `
        return res.json({ data: financers.map(f => f.financer_name) })

      // ============ PLEDGE AMOUNTS (Financer) ============
      case 'getPledgeAmounts':
        const amounts = await sql`
          SELECT * FROM pledge_amounts
          WHERE pledge_id = ${data.pledge_id}
          ORDER BY created_at DESC
        `
        return res.json({ data: amounts })

      case 'getAllPledgeAmounts':
        const allAmounts = await sql`
          SELECT pa.*, p.customer_name, p.status as pledge_status
          FROM pledge_amounts pa
          LEFT JOIN pledges p ON pa.pledge_id = p.id
          ORDER BY pa.created_at DESC
        `
        return res.json({ data: allAmounts })

      case 'getPledgeAmountsByFinancer':
        const financerAmounts = await sql`
          SELECT pa.*, p.customer_name, p.jewel_type, p.items, p.total_weight,
                 p.principal_amount, p.pledge_date, p.status as pledge_status
          FROM pledge_amounts pa
          LEFT JOIN pledges p ON pa.pledge_id = p.id
          WHERE pa.financer_name = ${data.financer_name}
          ORDER BY pa.created_at DESC
        `
        return res.json({ data: financerAmounts })

      case 'createPledgeAmount':
        const [newAmount] = await sql`
          INSERT INTO pledge_amounts (
            id, pledge_id, financer_name, amount, interest_rate,
            financer_date, status, notes, created_at, updated_at
          ) VALUES (
            ${data.id}, ${data.pledge_id}, ${data.financer_name}, ${data.amount},
            ${data.interest_rate}, ${data.financer_date}, ${data.status || 'active'},
            ${data.notes}, NOW(), NOW()
          ) RETURNING *
        `
        return res.json({ data: newAmount })

      case 'updatePledgeAmount':
        const [updatedAmount] = await sql`
          UPDATE pledge_amounts SET
            financer_name = COALESCE(${data.financer_name}, financer_name),
            amount = COALESCE(${data.amount}, amount),
            interest_rate = COALESCE(${data.interest_rate}, interest_rate),
            financer_date = COALESCE(${data.financer_date}, financer_date),
            status = COALESCE(${data.status}, status),
            notes = COALESCE(${data.notes}, notes),
            updated_at = NOW()
          WHERE id = ${data.id}
          RETURNING *
        `
        return res.json({ data: updatedAmount })

      case 'closePledgeAmountsByPledge':
        await sql`
          UPDATE pledge_amounts SET status = 'closed', updated_at = NOW()
          WHERE pledge_id = ${data.pledge_id}
        `
        return res.json({ success: true })

      case 'deletePledgeAmount':
        await sql`DELETE FROM pledge_amounts WHERE id = ${data.id}`
        return res.json({ success: true })

      // ============ OWNER REPLEDGES ============
      case 'getOwnerRepledges':
        const repledges = await sql`
          SELECT * FROM owner_repledges
          WHERE pledge_id = ${data.pledge_id}
          ORDER BY created_at DESC
        `
        return res.json({ data: repledges })

      case 'createOwnerRepledge':
        const [newRepledge] = await sql`
          INSERT INTO owner_repledges (
            id, pledge_id, amount, repledge_date, status, notes, created_at, updated_at
          ) VALUES (
            ${data.id}, ${data.pledge_id}, ${data.amount}, ${data.repledge_date},
            ${data.status || 'active'}, ${data.notes}, NOW(), NOW()
          ) RETURNING *
        `
        return res.json({ data: newRepledge })

      case 'updateOwnerRepledge':
        const [updatedRepledge] = await sql`
          UPDATE owner_repledges SET
            amount = COALESCE(${data.amount}, amount),
            repledge_date = COALESCE(${data.repledge_date}, repledge_date),
            status = COALESCE(${data.status}, status),
            notes = COALESCE(${data.notes}, notes),
            updated_at = NOW()
          WHERE id = ${data.id}
          RETURNING *
        `
        return res.json({ data: updatedRepledge })

      case 'deleteOwnerRepledge':
        await sql`DELETE FROM owner_repledges WHERE id = ${data.id}`
        return res.json({ success: true })

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
