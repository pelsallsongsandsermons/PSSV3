// Import the createClient function from the Supabase client library.
// This allows us to interact with the Supabase database.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define the name of the special row that holds usage data for the "Song for the Day".
const SONG_FOR_THE_DAY_TITLE = "@SONG FOR THE DAY"

Deno.serve(async (req) => {
    try {
        // 1. Initialize the Supabase client.
        // We use the Service Role Key to ensure we have permission to read/write all data,
        // bypassing Row Level Security (RLS) if necessary for this background task.
        // Deno.env.get accesses the environment variables set in the Supabase project.
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // --------------------------------------------------------------------------------
        // Step 2a. Find the row in the "songsList" table where "songTitle" is "@SONG FOR THE DAY".
        // --------------------------------------------------------------------------------
        const { data: songForTheDayRow, error: sftdError } = await supabase
            .from('songsList')
            .select('id')
            .eq('songTitle', SONG_FOR_THE_DAY_TITLE)
            .single()

        if (sftdError) {
            // If we can't find this special row, we can't proceed. Log the error and return.
            console.error('Error finding @SONG FOR THE DAY row:', sftdError)
            return new Response(JSON.stringify({ error: sftdError.message }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        if (!songForTheDayRow) {
            console.error('Row named "@SONG FOR THE DAY" not found.')
            return new Response(JSON.stringify({ error: 'Target row not found' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404,
            })
        }

        // Save the ID of the special row for later updates.
        const songForTheDayId = songForTheDayRow.id

        // --------------------------------------------------------------------------------
        // Step 2b. Search for unplayed songs.
        // We look for entries where "songfortheday_played" is FALSE.
        // We also exclude the "@SONG FOR THE DAY" row itself to avoid selecting it as a candidate.
        // --------------------------------------------------------------------------------
        let { data: candidates, error: candidateError } = await supabase
            .from('songsList')
            .select('*')
            .eq('songfortheday_played', false)
            .neq('songTitle', SONG_FOR_THE_DAY_TITLE) // Ensure we don't pick the placeholder row

        if (candidateError) {
            console.error('Error fetching candidates:', candidateError)
            return new Response(JSON.stringify({ error: candidateError.message }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        // --------------------------------------------------------------------------------
        // Step 2b-iii. If there are NO returned rows (all songs have been played).
        // --------------------------------------------------------------------------------
        if (!candidates || candidates.length === 0) {
            console.log('No unplayed songs found. Resetting all songs to unplayed...')

            // 1) Update all rows EXCEPT the "@SONG FOR THE DAY" row.
            // Set "songfortheday_played" back to FALSE.
            const { error: updateError } = await supabase
                .from('songsList')
                .update({ songfortheday_played: false })
                .neq('songTitle', SONG_FOR_THE_DAY_TITLE)

            if (updateError) {
                console.error('Error resetting songs:', updateError)
                return new Response(JSON.stringify({ error: updateError.message }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 500,
                })
            }

            // 2) Go back to search the "songsList" table again.
            // We explicitly fetch the pool again after the reset.
            const { data: refetchedCandidates, error: refetchError } = await supabase
                .from('songsList')
                .select('*')
                .eq('songfortheday_played', false)
                .neq('songTitle', SONG_FOR_THE_DAY_TITLE)

            if (refetchError) {
                console.error('Error refetching candidates:', refetchError)
                return new Response(JSON.stringify({ error: refetchError.message }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 500,
                })
            }

            candidates = refetchedCandidates || []
        }

        // Double check we have candidates now
        if (candidates.length === 0) {
            // This technically shouldn't happen unless the table is empty or update failed silently
            return new Response(JSON.stringify({ message: 'No songs available even after reset.' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // --------------------------------------------------------------------------------
        // Step 2b-i/ii. Select a row.
        // If > 1 row, select random. If 1 row, select that.
        // --------------------------------------------------------------------------------
        const randomIndex = Math.floor(Math.random() * candidates.length)
        const selectedSong = candidates[randomIndex]

        console.log(`Selected song: ${selectedSong.songTitle} (ID: ${selectedSong.id})`)

        // --------------------------------------------------------------------------------
        // Step 2c-i. Set "songfortheday_played" to TRUE for the selected row.
        // --------------------------------------------------------------------------------
        const { error: markPlayedError } = await supabase
            .from('songsList')
            .update({ songfortheday_played: true })
            .eq('id', selectedSong.id)

        if (markPlayedError) {
            console.error('Error marking song as played:', markPlayedError)
            return new Response(JSON.stringify({ error: markPlayedError.message }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        // --------------------------------------------------------------------------------
        // Step 2c-ii. Copy columns to the "@SONG FOR THE DAY" row.
        // Columns to copy: lyricsUrl, copyRight, youtube_url, startAt, endAt
        // --------------------------------------------------------------------------------
        const { error: copyError } = await supabase
            .from('songsList')
            .update({
                lyricsUrl: selectedSong.lyricsUrl,
                copyRight: selectedSong.copyRight,
                youtube_url: selectedSong.youtube_url,
                startAt: selectedSong.startAt,
                endAt: selectedSong.endAt,
                // We might also want to update the title or other metadata if the app expects it,
                // but the requirements specifically listed these 5 columns.
                // The songTitle of the target row remains "@SONG FOR THE DAY" as an identifier.
            })
            .eq('id', songForTheDayId)

        if (copyError) {
            console.error('Error updating @SONG FOR THE DAY row:', copyError)
            return new Response(JSON.stringify({ error: copyError.message }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        return new Response(
            JSON.stringify({
                message: 'Song of the day updated successfully',
                selectedSong: selectedSong.songTitle,
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
