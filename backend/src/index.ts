
import app from "./app";
import { logger } from "./utils/logger";
const PORT = process.env.PORT || 5000;
// Start the server
app.listen(PORT, () => {
logger.info(`Server running on port ${PORT}`);
});

