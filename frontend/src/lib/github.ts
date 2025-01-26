import axios from 'axios';

import { BRANCH, REPO_NAME, REPO_OWNER } from '@/lib/constants';

const GITHUB_API_URL = 'https://api.github.com';

export default async function pushToGitHub(
  fileName: string,
  fileContent: string,
  commitMessage: string,
) {
  try {
    const accessToken: string = await browser.storage.sync
      .get('accessToken')
      .then((result) => result.accessToken);
    if (!accessToken) {
      throw new Error('Access token not found');
    }

    console.log('Initiating push to GitHub...');

    // Step 1: Get the latest commit SHA
    const { data: refData } = await axios.get(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );
    const latestCommitSha = refData.object.sha;
    console.log('Latest commit SHA:', latestCommitSha);

    // Step 2: Get the latest commit details
    const { data: commitData } = await axios.get(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${latestCommitSha}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );
    const baseTreeSha = commitData.tree.sha;
    console.log('Base tree SHA:', baseTreeSha);

    // Step 3: Get the current tree to check if the file exists
    const { data: currentTreeData } = await axios.get(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${baseTreeSha}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    // Check if the file already exists in the current tree
    const existingFile = currentTreeData.tree.find(
      (item: any) => item.path === fileName && item.type === 'blob',
    );

    // Step 4: Create a new tree
    const tree = [
      {
        path: fileName,
        mode: '100644', // File mode (100644 for a blob/file)
        type: 'blob',
        content: fileContent,
      },
    ];

    // If the file exists, include it in the tree with the new content
    if (existingFile) {
      console.log(`File "${fileName}" already exists. Updating content...`);
    } else {
      console.log(`File "${fileName}" does not exist. Creating new file...`);
    }

    const { data: treeData } = await axios.post(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
      {
        base_tree: baseTreeSha,
        tree,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );
    const newTreeSha = treeData.sha;
    console.log('New tree SHA:', newTreeSha);

    // Step 5: Create a new commit
    const { data: commitResponse } = await axios.post(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
      {
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );
    const newCommitSha = commitResponse.sha;
    console.log('New commit SHA:', newCommitSha);

    // Step 6: Update the branch reference
    await axios.patch(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`,
      {
        sha: newCommitSha,
        force: false,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    console.log('Code pushed successfully!');
  } catch (error) {
    console.error('Error pushing code to GitHub:', error);
  }
}
