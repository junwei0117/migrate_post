import axios from 'axios';
import {
    pixnetUserName as user,
    postAmout as per_page,
    access_token,
    getAllPostFromPixnetAPI,
    searchPostLinkFromWordPressAPI,
    annonceTop,
    annonceButton
} from './config';

const compareFailedList: string[] = [];
const editFailedList: any[] = [];
const dropPostList: any[] = [];

const getAllPostFromPixnet = async () => {
    const response = await axios.get(getAllPostFromPixnetAPI, {
        params: {
            user,
            per_page
        }
    });
    const allPostList = response.data.articles;

    return allPostList;
};

const editPixetPostBody = async (body: string, postID: number) => {
    const url = encodeURI(`${getAllPostFromPixnetAPI}/${postID}?body=${body}&access_token=${access_token}`);
    const response = await axios.post(url);
    const postTitle = response.data.article.title;
    const editedBody = response.data.article.body;
    if (editedBody == body){
        return true;
    } else {
        editFailedList.push(postTitle);
        return false;
    }
}

const searchPostLinkFromWordPress = async (pixnetPostTitle: string) => {
    console.log(pixnetPostTitle);
    const response = await axios.get(searchPostLinkFromWordPressAPI, {
        params: {
            search: pixnetPostTitle
        }
    })
    const reply = response.data;

    return reply;
}

const comparePostTitle = (pixetPostTitle: string, wordPressPostTitle: string) => {
    const pixetPostTitleLegth = pixetPostTitle.length;
    const wordPressPostTitleLength = wordPressPostTitle.length;
    if (pixetPostTitleLegth == wordPressPostTitleLength) {
        console.log('Post Title same.');
        return true
    } else {
        compareFailedList.push(pixetPostTitle);
        console.log('\x1b[41m%s\x1b[0m', 'Post Title different!');
        return false;
    }
}

const checkPostAvaliable = (post: any) => {
    if (post.status == 2) {
        return true;
    } else {
        dropPostList.push(post.title);
    }
}

const run = async () => {
    const pixnetAllPostList = await getAllPostFromPixnet();

    for (let num = 0; num < pixnetAllPostList.length; num++) {
        console.log(`No.:${num + 1}------------------`);
        const pixnetPostObject = pixnetAllPostList[num];
        const postAvalibale = checkPostAvaliable(pixnetPostObject);
        if (postAvalibale) {
            const pixnetPostID = pixnetPostObject.id;
            const pixetPostTitle = pixnetPostObject.title;
            console.log(`Pixnet Post ID: ${pixnetPostID}\nPixnet Post Title: ${pixetPostTitle}`)
            const searchKeyword = pixetPostTitle.substring(10);
            const searchResponse = await searchPostLinkFromWordPress(searchKeyword);
            if (searchResponse[0]) {
                const wordPressPostTitle = searchResponse[0].title.rendered;
                const wordPressPostLink = searchResponse[0].link;
                console.log(`WordPress Post Title: ${wordPressPostTitle}\nWordPress Post Link: ${wordPressPostLink}`)
                const postTitleSame = comparePostTitle(pixetPostTitle, wordPressPostTitle);
                if (postTitleSame) {
                    const editBody = `${annonceTop}${wordPressPostLink}${annonceButton}`;
                    const editedSuccess = await editPixetPostBody(editBody, pixnetPostID);
                    if (editedSuccess) {
                        console.log('Edit Success!')
                    } else {
                        console.log('Edit Failed!')
                    }
                }
            }
        }
    }

    console.log('Compare Failed:');
    console.log(compareFailedList);

    console.log('Drop Post:');
    console.log(dropPostList);

    console.log('Edited Failed:')
    console.log(editFailedList);

}

run();