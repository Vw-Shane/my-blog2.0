const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router(); // Use router from express

const pokemonAPI = process.env.POKEMON_TCG_API_KEY;
const pok_URL = 'https://api.pokemontcg.io/v2/cards';

// Fetch cards from the Pokémon TCG API
async function fetchCards(query) {
    try {
        const response = await axios.get(pok_URL, {
            headers: {
                'X-Api-Key': pokemonAPI
            },
            params: {
                q: query // Example query
            }
        });
        return response.data.data; // Return card data
    } catch (error) {
        console.error('Error fetching cards:', error);
        throw error;
    }
}

// Function to break the user input into segments of three letters or fewer
function breakIntoSegments(userInput) {
    const segments = [];
    for (let i = 0; i < userInput.length; i += 3) {
        segments.push(userInput.substring(i, i + 3));
    }
    return segments;
}

// Function to find a valid segment with results
async function findValidSegment(segments) {
    const attempts = 10; // Number of attempts to find a valid segment
    let attemptsLeft = attempts;
    let found = false;
    let resultCards = [];
    let chosenSegment = '';

    while (attemptsLeft > 0 && !found) {
        // Randomly choose one of the segments
        const randomSegment = segments[Math.floor(Math.random() * segments.length)];
        const query = `name:${randomSegment}*`;

        // Fetch Pokémon cards based on the query
        resultCards = await fetchCards(query);

        if (resultCards.length > 0) {
            chosenSegment = randomSegment;
            found = true;
        } else {
            attemptsLeft--;
        }
    }

    return { resultCards, chosenSegment, found };
}

// Define the /pokemon route to handle form submissions and display results
router.get('/', async (req, res) => {
    try {
        const userInput = req.query.name || '';
        let cards = [];
        let message = '';

        if (userInput) {
            // Break the user input into segments of three letters or fewer
            const segments = breakIntoSegments(userInput);

            if (segments.length > 0) {
                // Find a valid segment with results
                const { resultCards, chosenSegment, found } = await findValidSegment(segments);

                if (found) {
                    cards = resultCards;
                    message = `Pokémon found with segment "${chosenSegment}".`;
                } else {
                    message = `No Pokémon found with any segment of "${userInput}".`;
                }
            } else {
                message = 'Invalid input.';
            }
        }

        res.render('pokemon', { cards, search: userInput, message });
    } catch (error) {
        res.status(500).send('Error fetching Pokémon cards.');
    }
});

module.exports = router;
